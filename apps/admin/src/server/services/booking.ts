import { prisma } from '../db';
import { CreateBookingInput, RescheduleBookingInput } from '@chairly/shared';
import { AppointmentStatus } from '@prisma/client';
import { addMinutes, isBefore, parseISO } from 'date-fns';
import { combineDateAndTimeInTimezone, formatDateInTimezone, formatTimeInTimezone, intervalsOverlap } from '../utils/timezone';
import { AppError } from '../middlewares/errorHandler';

export class ConflictError extends AppError {
  constructor(message: string = 'The selected appointment slot is no longer available.') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Generates a human-friendly booking reference: e.g. CH-4829
 */
function generateBookingReference(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CH-${random}`;
}

export async function createBooking(customerId: string, input: CreateBookingInput) {
  const { shopId, serviceId, notes } = input;
  let requestedBarberId = input.barberId;
  const requestedStartTime = new Date(input.startTime);

  // 1. Fetch shop settings
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { workingHours: true },
  });

  if (!shop || !shop.isActive) {
    throw new AppError('Barbershop not found or inactive', 404);
  }

  // 2. Fetch service
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      barbers: { include: { barber: true } },
    },
  });

  if (!service || !service.isActive || service.shopId !== shopId) {
    throw new AppError('Service is not available at this shop', 400);
  }

  // Calculate times
  const requestedEndTime = addMinutes(requestedStartTime, service.durationMinutes);
  const requestedBufferEndTime = addMinutes(requestedStartTime, service.durationMinutes + service.bufferMinutes);

  // Lead time validation
  const now = new Date();
  const minAllowedTime = addMinutes(now, shop.leadTimeMinutes);
  if (isBefore(requestedStartTime, minAllowedTime)) {
    throw new AppError(`Appointments must be booked at least ${shop.leadTimeMinutes} minutes in advance`, 400);
  }

  // If "any barber" was chosen, find an eligible active barber
  if (!requestedBarberId) {
    const eligibleBarbers = service.barbers
      .filter((b) => b.barber.isActive)
      .map((b) => b.barberId);

    if (eligibleBarbers.length === 0) {
      throw new AppError('No barbers currently offer this service', 400);
    }
    // We will attempt to book the first available barber inside the transaction
    requestedBarberId = eligibleBarbers[0];
  } else {
    // Verify specific barber eligibility
    const eligible = service.barbers.some(
      (b) => b.barberId === requestedBarberId && b.barber.isActive
    );
    if (!eligible) {
      throw new AppError('The selected barber is not available for this service', 400);
    }
  }

  const barberIdToLock = requestedBarberId;

  // 3. TRANSACTION WITH CONCURRENCY ADVISORY & ROW LOCKING
  const appointment = await prisma.$transaction(async (tx) => {
    // A) Acquire a transaction-scoped PostgreSQL advisory lock for the barber
    // `hashtext('barber_' || id)` creates an int4 hash suitable for pg_advisory_xact_lock
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`barber_${barberIdToLock}`}))
    `;

    // B) Row-level lock on the BarberProfile table
    const lockedBarber = await tx.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT id, name FROM "BarberProfile" WHERE id = ${barberIdToLock} FOR UPDATE
    `;

    if (!lockedBarber || lockedBarber.length === 0) {
      throw new AppError('Barber not found', 404);
    }

    // C) Strict overlap query: check if any active appointment for this barber overlaps
    // Overlap formula: (existing.startTime < new.bufferEndTime AND existing.bufferEndTime > new.startTime)
    const overlapping = await tx.appointment.findFirst({
      where: {
        barberId: barberIdToLock,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
        startTime: {
          lt: requestedBufferEndTime,
        },
        bufferEndTime: {
          gt: requestedStartTime,
        },
      },
    });

    if (overlapping) {
      throw new ConflictError(
        'This time slot was just booked by another customer. Please choose a different time slot.'
      );
    }

    // D) Verify blocked times
    const blocked = await tx.barberBlockedTime.findFirst({
      where: {
        barberId: barberIdToLock,
        startTime: { lt: requestedBufferEndTime },
        endTime: { gt: requestedStartTime },
      },
    });

    if (blocked) {
      throw new ConflictError('The barber is not available during this time period.');
    }

    // E) Create the appointment with historical snapshot
    let bookingRef = generateBookingReference();
    // Ensure booking reference uniqueness
    let existingRef = await tx.appointment.findUnique({ where: { bookingReference: bookingRef } });
    while (existingRef) {
      bookingRef = generateBookingReference();
      existingRef = await tx.appointment.findUnique({ where: { bookingReference: bookingRef } });
    }

    const created = await tx.appointment.create({
      data: {
        bookingReference: bookingRef,
        shopId,
        barberId: barberIdToLock,
        customerId,
        serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        currency: shop.currency,
        status: AppointmentStatus.CONFIRMED,
        startTime: requestedStartTime,
        endTime: requestedEndTime,
        bufferEndTime: requestedBufferEndTime,
        notes: notes || null,
      },
      include: {
        shop: true,
        barber: true,
        service: true,
        customer: true,
      },
    });

    // F) Audit log / status history
    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: created.id,
        newStatus: AppointmentStatus.CONFIRMED,
        changedById: customerId,
        reason: 'Initial customer booking',
      },
    });

    return created;
  });

  return appointment;
}

export async function rescheduleBooking(
  appointmentId: string,
  userId: string,
  isStaff: boolean,
  input: RescheduleBookingInput
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shop: true, barber: true },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  // Authorization check: only customer or authorized shop staff can reschedule
  if (!isStaff && appointment.customerId !== userId) {
    throw new AppError('You are not authorized to reschedule this appointment', 403);
  }

  // Only active bookings can be rescheduled
  if (
    appointment.status !== AppointmentStatus.CONFIRMED &&
    appointment.status !== AppointmentStatus.PENDING
  ) {
    throw new AppError(`Cannot reschedule an appointment with status ${appointment.status}`, 400);
  }

  const targetBarberId = input.barberId || appointment.barberId;
  const newStartTime = new Date(input.newStartTime);
  const newEndTime = addMinutes(newStartTime, appointment.serviceDuration);
  const newBufferEndTime = addMinutes(newStartTime, appointment.serviceDuration + appointment.bufferMinutes);

  return await prisma.$transaction(async (tx) => {
    // Advisory lock on target barber
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`barber_${targetBarberId}`}))
    `;

    // Row-level lock
    await tx.$queryRaw`
      SELECT id FROM "BarberProfile" WHERE id = ${targetBarberId} FOR UPDATE
    `;

    // Check overlap excluding this appointment itself
    const overlapping = await tx.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        barberId: targetBarberId,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
        startTime: { lt: newBufferEndTime },
        bufferEndTime: { gt: newStartTime },
      },
    });

    if (overlapping) {
      throw new ConflictError('The requested new time slot is not available.');
    }

    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        barberId: targetBarberId,
        startTime: newStartTime,
        endTime: newEndTime,
        bufferEndTime: newBufferEndTime,
      },
      include: {
        shop: true,
        barber: true,
        service: true,
        customer: true,
      },
    });

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId,
        previousStatus: appointment.status,
        newStatus: appointment.status,
        changedById: userId,
        reason: 'Rescheduled to new time slot',
      },
    });

    return updated;
  });
}

export async function cancelBooking(
  appointmentId: string,
  userId: string,
  isStaff: boolean,
  reason?: string | null
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shop: true },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (!isStaff && appointment.customerId !== userId) {
    throw new AppError('You are not authorized to cancel this appointment', 403);
  }

  if (appointment.status === AppointmentStatus.CANCELLED) {
    throw new AppError('Appointment is already cancelled', 400);
  }

  if (appointment.status === AppointmentStatus.COMPLETED) {
    throw new AppError('Completed appointments cannot be cancelled', 400);
  }

  // If customer is cancelling, check shop cancellation deadline
  if (!isStaff) {
    const now = new Date();
    const deadlineHours = appointment.shop.cancelDeadlineHours;
    const hoursDifference = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < deadlineHours) {
      throw new AppError(
        `Appointments cannot be cancelled within ${deadlineHours} hours of scheduled start time. Please contact the barbershop directly.`,
        400
      );
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason || 'Cancelled by customer',
    },
    include: {
      shop: true,
      barber: true,
      service: true,
      customer: true,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      appointmentId,
      previousStatus: appointment.status,
      newStatus: AppointmentStatus.CANCELLED,
      changedById: userId,
      reason: reason || 'Cancellation confirmed',
    },
  });

  return updated;
}
