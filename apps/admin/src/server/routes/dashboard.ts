import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireShopMember } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';
import { toZonedTime } from 'date-fns-tz';

const router = Router();

router.get(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER', 'BARBER']),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;

      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        throw new AppError('Shop not found', 404);
      }

      const now = new Date();
      const zonedNow = toZonedTime(now, shop.timezone);
      const todayStart = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate(), 0, 0, 0);
      const todayEnd = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate(), 23, 59, 59, 999);

      // Aggregate statistics from real DB records
      const [
        todayAppointments,
        upcomingCount,
        completedAppointments,
        cancelledCount,
        activeBarbersCount,
        recentAppointments,
      ] = await Promise.all([
        // Today's appointments
        prisma.appointment.findMany({
          where: {
            shopId,
            startTime: { gte: todayStart, lte: todayEnd },
          },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
            barber: { select: { name: true } },
          },
          orderBy: { startTime: 'asc' },
        }),

        // Upcoming future appointments
        prisma.appointment.count({
          where: {
            shopId,
            startTime: { gte: now },
            status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN'] },
          },
        }),

        // Completed appointments for revenue
        prisma.appointment.findMany({
          where: {
            shopId,
            status: 'COMPLETED',
          },
          select: { servicePrice: true },
        }),

        // Cancelled count
        prisma.appointment.count({
          where: { shopId, status: 'CANCELLED' },
        }),

        // Active barbers count
        prisma.barberProfile.count({
          where: { shopId, isActive: true },
        }),

        // 10 most recent appointments
        prisma.appointment.findMany({
          where: { shopId },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
            barber: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      // Calculate completed revenue
      const completedRevenue = completedAppointments.reduce(
        (sum, a) => sum + (a.servicePrice || 0),
        0
      );

      // Calculate expected revenue from confirmed/in-progress appointments
      const pendingAppointments = await prisma.appointment.findMany({
        where: {
          shopId,
          status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] },
          startTime: { gte: now },
        },
        select: { servicePrice: true },
      });

      const expectedRevenue = pendingAppointments.reduce(
        (sum, a) => sum + (a.servicePrice || 0),
        0
      );

      res.json({
        todayAppointmentsCount: todayAppointments.length,
        upcomingAppointmentsCount: upcomingCount,
        completedAppointmentsCount: completedAppointments.length,
        cancelledAppointmentsCount: cancelledCount,
        completedRevenue,
        expectedRevenue,
        activeBarbersCount,
        currency: shop.currency,
        todaySchedule: todayAppointments.map((a) => ({
          id: a.id,
          bookingReference: a.bookingReference,
          customerName: `${a.customer.firstName} ${a.customer.lastName}`,
          customerPhone: a.customer.phone,
          barberName: a.barber.name,
          serviceName: a.serviceName,
          servicePrice: a.servicePrice,
          status: a.status,
          startTime: a.startTime.toISOString(),
          endTime: a.endTime.toISOString(),
        })),
        recentAppointments: recentAppointments.map((a) => ({
          id: a.id,
          bookingReference: a.bookingReference,
          customerName: `${a.customer.firstName} ${a.customer.lastName}`,
          customerEmail: a.customer.email,
          customerPhone: a.customer.phone,
          barberName: a.barber.name,
          serviceName: a.serviceName,
          servicePrice: a.servicePrice,
          status: a.status,
          startTime: a.startTime.toISOString(),
          createdAt: a.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
