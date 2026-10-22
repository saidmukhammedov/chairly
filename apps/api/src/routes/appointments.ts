import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireShopMember } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import {
  CreateBookingSchema,
  RescheduleBookingSchema,
  CancelBookingSchema,
  UpdateStatusSchema,
  ALLOWED_STATUS_TRANSITIONS,
} from '@chairly/shared';
import { AppointmentStatus } from '@prisma/client';
import { createBooking, cancelBooking, rescheduleBooking } from '../services/booking';

const router = Router();

// ================= CUSTOMER ROUTES ================= //

// Create Booking
router.post('/', authenticate, validateBody(CreateBookingSchema), async (req: Request, res: Response, next) => {
  try {
    const customerId = req.user!.userId;
    const appointment = await createBooking(customerId, req.body);
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

// Get My Appointments (Customer)
router.get('/my', authenticate, async (req: Request, res: Response, next) => {
  try {
    const customerId = req.user!.userId;
    const { statusGroup } = req.query; // 'upcoming' | 'past' | 'cancelled' | 'all'

    const now = new Date();
    let whereClause: any = { customerId };

    if (statusGroup === 'upcoming') {
      whereClause.status = { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] };
      whereClause.startTime = { gte: now };
    } else if (statusGroup === 'past') {
      whereClause.OR = [
        { status: 'COMPLETED' },
        { status: { in: ['CONFIRMED', 'NO_SHOW'] }, startTime: { lt: now } },
      ];
    } else if (statusGroup === 'cancelled') {
      whereClause.status = 'CANCELLED';
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            logoUrl: true,
            coverImageUrl: true,
            currency: true,
          },
        },
        barber: {
          select: { id: true, name: true, avatarUrl: true, specialty: true },
        },
      },
      orderBy: { startTime: statusGroup === 'upcoming' ? 'asc' : 'desc' },
    });

    const formatted = appointments.map((a) => ({
      id: a.id,
      bookingReference: a.bookingReference,
      shopId: a.shopId,
      shopName: a.shop.name,
      shopAddress: a.shop.address,
      shopPhone: a.shop.phone,
      shopLogoUrl: a.shop.logoUrl,
      shopCoverUrl: a.shop.coverImageUrl,
      barberId: a.barberId,
      barberName: a.barber.name,
      barberAvatarUrl: a.barber.avatarUrl,
      customerId: a.customerId,
      serviceId: a.serviceId,
      serviceName: a.serviceName,
      servicePrice: a.servicePrice,
      serviceDuration: a.serviceDuration,
      bufferMinutes: a.bufferMinutes,
      currency: a.currency,
      status: a.status,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      bufferEndTime: a.bufferEndTime.toISOString(),
      notes: a.notes,
      cancelledAt: a.cancelledAt?.toISOString() || null,
      cancellationReason: a.cancellationReason,
      createdAt: a.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// Get Appointment Details by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        shop: true,
        barber: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Ensure only the customer or shop staff can view
    const isCustomer = appointment.customerId === userId;
    let isStaff = false;
    if (!isCustomer) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } },
      });
      isStaff = !!membership;
    }

    if (!isCustomer && !isStaff && req.user!.role !== 'OWNER') {
      throw new AppError('Access denied', 403);
    }

    res.json({
      ...appointment,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      bufferEndTime: appointment.bufferEndTime.toISOString(),
      customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
      customerEmail: appointment.customer.email,
      customerPhone: appointment.customer.phone,
      barberName: appointment.barber.name,
      shopName: appointment.shop.name,
      shopAddress: appointment.shop.address,
    });
  } catch (err) {
    next(err);
  }
});

// Cancel Appointment (Customer or Staff)
router.post('/:id/cancel', authenticate, validateBody(CancelBookingSchema), async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { reason } = req.body;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    let isStaff = false;
    if (appointment.customerId !== userId) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } },
      });
      isStaff = !!membership;
    }

    const cancelled = await cancelBooking(id, userId, isStaff, reason);
    res.json(cancelled);
  } catch (err) {
    next(err);
  }
});

// Reschedule Appointment (Customer or Staff)
router.post('/:id/reschedule', authenticate, validateBody(RescheduleBookingSchema), async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    let isStaff = false;
    if (appointment.customerId !== userId) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } },
      });
      isStaff = !!membership;
    }

    const rescheduled = await rescheduleBooking(id, userId, isStaff, req.body);
    res.json(rescheduled);
  } catch (err) {
    next(err);
  }
});

// ================= ADMIN / STAFF ROUTES ================= //

// Get Shop Appointments (Calendar & List view)
router.get(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER', 'BARBER']),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const { date, startDate, endDate, barberId, status, search } = req.query;

      const whereClause: any = { shopId };

      if (date && typeof date === 'string') {
        const dayStart = new Date(`${date}T00:00:00.000Z`);
        const dayEnd = new Date(`${date}T23:59:59.999Z`);
        whereClause.startTime = { gte: dayStart, lte: dayEnd };
      } else if (startDate && endDate) {
        whereClause.startTime = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      if (barberId && typeof barberId === 'string') {
        whereClause.barberId = barberId;
      }

      if (status && typeof status === 'string') {
        whereClause.status = status;
      }

      if (search && typeof search === 'string') {
        whereClause.OR = [
          { bookingReference: { contains: search, mode: 'insensitive' } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          barber: { select: { id: true, name: true, avatarUrl: true } },
          service: { select: { id: true, name: true, category: true } },
        },
        orderBy: { startTime: 'asc' },
      });

      const formatted = appointments.map((a) => ({
        id: a.id,
        bookingReference: a.bookingReference,
        shopId: a.shopId,
        barberId: a.barberId,
        barberName: a.barber.name,
        barberAvatarUrl: a.barber.avatarUrl,
        customerId: a.customerId,
        customerName: `${a.customer.firstName} ${a.customer.lastName}`,
        customerEmail: a.customer.email,
        customerPhone: a.customer.phone,
        serviceId: a.serviceId,
        serviceName: a.serviceName,
        servicePrice: a.servicePrice,
        serviceDuration: a.serviceDuration,
        bufferMinutes: a.bufferMinutes,
        currency: a.currency,
        status: a.status,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        bufferEndTime: a.bufferEndTime.toISOString(),
        notes: a.notes,
        createdAt: a.createdAt.toISOString(),
      }));

      res.json(formatted);
    } catch (err) {
      next(err);
    }
  }
);

// Update Status with Strict Transition Policy
router.patch(
  '/shop/:shopId/:id/status',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER', 'BARBER']),
  validateBody(UpdateStatusSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId, id } = req.params;
      const { status: newStatus, notes } = req.body;
      const userId = req.user!.userId;

      const appointment = await prisma.appointment.findFirst({
        where: { id, shopId },
      });

      if (!appointment) {
        throw new AppError('Appointment not found for this shop', 404);
      }

      const currentStatus = appointment.status as AppointmentStatus;
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(newStatus as AppointmentStatus)) {
        throw new AppError(
          `Invalid state transition: Cannot transition appointment from '${currentStatus}' to '${newStatus}'.`,
          400
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id },
          data: {
            status: newStatus as AppointmentStatus,
            cancelledAt: newStatus === 'CANCELLED' ? new Date() : appointment.cancelledAt,
            cancellationReason: newStatus === 'CANCELLED' ? (notes || 'Cancelled by staff') : appointment.cancellationReason,
          },
          include: {
            customer: true,
            barber: true,
          },
        });

        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: id,
            previousStatus: currentStatus,
            newStatus: newStatus as AppointmentStatus,
            changedById: userId,
            reason: notes || `Status changed from ${currentStatus} to ${newStatus}`,
          },
        });

        return appt;
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/status',
  authenticate,
  validateBody(UpdateStatusSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { id } = req.params;
      const { status: newStatus, notes } = req.body;
      const userId = req.user!.userId;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } },
      });

      if (!membership && req.user!.role !== 'OWNER') {
        throw new AppError('Access denied: not authorized for this shop', 403);
      }

      const currentStatus = appointment.status as AppointmentStatus;
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(newStatus as AppointmentStatus)) {
        throw new AppError(
          `Invalid state transition: Cannot transition appointment from '${currentStatus}' to '${newStatus}'.`,
          400
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id },
          data: {
            status: newStatus as AppointmentStatus,
            cancelledAt: newStatus === 'CANCELLED' ? new Date() : appointment.cancelledAt,
            cancellationReason: newStatus === 'CANCELLED' ? (notes || 'Cancelled by staff') : appointment.cancellationReason,
          },
          include: {
            customer: true,
            barber: true,
          },
        });

        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: id,
            previousStatus: currentStatus,
            newStatus: newStatus as AppointmentStatus,
            changedById: userId,
            reason: notes || `Status changed from ${currentStatus} to ${newStatus}`,
          },
        });

        return appt;
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
