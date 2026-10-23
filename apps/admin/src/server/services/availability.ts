import { prisma } from '../db';
import { ACTIVE_APPOINTMENT_STATUSES, TimeSlot } from '@chairly/shared';
import { combineDateAndTimeInTimezone, formatTimeInTimezone, intervalsOverlap } from '../utils/timezone';
import { addMinutes, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export interface AvailabilityOptions {
  shopId: string;
  serviceId: string;
  barberId?: string;
  dateStr: string; // "2026-10-22"
}

export async function getAvailableSlots(options: AvailabilityOptions): Promise<TimeSlot[]> {
  const { shopId, serviceId, barberId, dateStr } = options;

  // 1. Fetch shop with timezone and working hours
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      workingHours: true,
    },
  });

  if (!shop || !shop.isActive) {
    throw new Error('Shop not found or inactive');
  }

  // 2. Fetch service
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      barbers: {
        include: { barber: true },
      },
    },
  });

  if (!service || !service.isActive || service.shopId !== shopId) {
    throw new Error('Service not found or not offered at this barbershop');
  }

  // 3. Determine target barbers
  let eligibleBarberIds: string[] = [];
  if (barberId) {
    // Verify barber offers this service and belongs to shop
    const eligible = service.barbers.some((bs) => bs.barberId === barberId && bs.barber.isActive);
    if (!eligible) {
      throw new Error('The selected barber does not offer this service or is unavailable');
    }
    eligibleBarberIds = [barberId];
  } else {
    // "Any available barber" mode
    eligibleBarberIds = service.barbers
      .filter((bs) => bs.barber.isActive)
      .map((bs) => bs.barberId);
  }

  if (eligibleBarberIds.length === 0) {
    return [];
  }

  // 4. Calculate day of week (0=Sunday ... 6=Saturday)
  // Combine date with 12:00 PM in shop timezone to safely inspect dayOfWeek
  const midDay = combineDateAndTimeInTimezone(dateStr, '12:00', shop.timezone);
  const zonedMidDay = toZonedTime(midDay, shop.timezone);
  const dayOfWeek = zonedMidDay.getDay();

  // 5. Check if shop is open today
  const shopHours = shop.workingHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!shopHours || shopHours.isClosed) {
    return [];
  }

  const shopOpenDate = combineDateAndTimeInTimezone(dateStr, shopHours.openTime, shop.timezone);
  const shopCloseDate = combineDateAndTimeInTimezone(dateStr, shopHours.closeTime, shop.timezone);

  // 6. Fetch barbers info, schedules, breaks, blocked times, and existing appointments
  const barbers = await prisma.barberProfile.findMany({
    where: {
      id: { in: eligibleBarberIds },
      isActive: true,
    },
    include: {
      schedules: { where: { dayOfWeek } },
      breaks: { where: { dayOfWeek } },
      blockedTimes: {
        where: {
          startTime: { lte: shopCloseDate },
          endTime: { gte: shopOpenDate },
        },
      },
    },
  });

  // Fetch active appointments on this day for these barbers
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      barberId: { in: eligibleBarberIds },
      status: { in: ACTIVE_APPOINTMENT_STATUSES as any },
      startTime: { lte: shopCloseDate },
      bufferEndTime: { gte: shopOpenDate },
    },
  });

  const now = new Date();
  const minBookingTime = addMinutes(now, shop.leadTimeMinutes);

  // Total slot duration = service duration + buffer minutes
  const totalSlotMinutes = service.durationMinutes + service.bufferMinutes;

  // Slicing step in minutes (standard 15 or 30 min intervals)
  const slotIntervalMinutes = 15;

  const resultSlots: TimeSlot[] = [];

  let currentSlotStart = shopOpenDate;

  while (isBefore(addMinutes(currentSlotStart, service.durationMinutes), shopCloseDate) ||
         currentSlotStart.getTime() + service.durationMinutes * 60000 === shopCloseDate.getTime()) {
    const slotServiceEnd = addMinutes(currentSlotStart, service.durationMinutes);
    const slotBufferEnd = addMinutes(currentSlotStart, totalSlotMinutes);

    // If buffer exceeds shop close by a small amount, verify if allowed or limit to close
    if (isAfter(slotServiceEnd, shopCloseDate)) {
      break;
    }

    const timeLabel = formatTimeInTimezone(currentSlotStart, shop.timezone);
    const isoString = currentSlotStart.toISOString();

    // Past time or within lead time check
    if (isBefore(currentSlotStart, minBookingTime)) {
      // Slot in the past / too soon to book
      resultSlots.push({
        time: timeLabel,
        isoString,
        available: false,
        reason: 'Too late to book or in the past',
      });
      currentSlotStart = addMinutes(currentSlotStart, slotIntervalMinutes);
      continue;
    }

    // Check which barbers are available for this slot
    let availableBarber: (typeof barbers)[0] | null = null;

    for (const barber of barbers) {
      const schedule = barber.schedules[0];
      if (!schedule || !schedule.isWorking) {
        continue;
      }

      const barberStart = combineDateAndTimeInTimezone(dateStr, schedule.startTime, shop.timezone);
      const barberEnd = combineDateAndTimeInTimezone(dateStr, schedule.endTime, shop.timezone);

      // Check if slot falls completely within barber working hours
      if (isBefore(currentSlotStart, barberStart) || isAfter(slotBufferEnd, barberEnd)) {
        continue;
      }

      // Check breaks
      const inBreak = barber.breaks.some((brk) => {
        const breakStart = combineDateAndTimeInTimezone(dateStr, brk.startTime, shop.timezone);
        const breakEnd = combineDateAndTimeInTimezone(dateStr, brk.endTime, shop.timezone);
        return intervalsOverlap(currentSlotStart, slotBufferEnd, breakStart, breakEnd);
      });

      if (inBreak) {
        continue;
      }

      // Check blocked times
      const isBlocked = barber.blockedTimes.some((blk) => {
        return intervalsOverlap(currentSlotStart, slotBufferEnd, blk.startTime, blk.endTime);
      });

      if (isBlocked) {
        continue;
      }

      // Check existing appointments
      const hasConflict = existingAppointments.some((appt) => {
        if (appt.barberId !== barber.id) return false;
        return intervalsOverlap(currentSlotStart, slotBufferEnd, appt.startTime, appt.bufferEndTime);
      });

      if (!hasConflict) {
        availableBarber = barber;
        break; // Found an available barber
      }
    }

    if (availableBarber) {
      resultSlots.push({
        time: timeLabel,
        isoString,
        startTime: isoString,
        available: true,
        barberId: availableBarber.id,
        barberName: availableBarber.name,
      });
    } else {
      resultSlots.push({
        time: timeLabel,
        isoString,
        startTime: isoString,
        available: false,
        reason: 'Barber is booked or unavailable',
      });
    }

    currentSlotStart = addMinutes(currentSlotStart, slotIntervalMinutes);
  }

  return resultSlots;
}
