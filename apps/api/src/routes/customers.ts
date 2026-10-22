import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireShopMember } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

// Get customers who have booked at this shop
router.get(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER', 'BARBER']),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const { search } = req.query;

      // Find all distinct customer IDs who have booked in this shop
      const appointments = await prisma.appointment.findMany({
        where: { shopId },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      // Group by customer
      const customerMap = new Map<string, any>();
      for (const a of appointments) {
        if (!customerMap.has(a.customerId)) {
          customerMap.set(a.customerId, {
            ...a.customer,
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalSpent: 0,
            lastBookingDate: a.startTime.toISOString(),
          });
        }
        const record = customerMap.get(a.customerId);
        record.totalBookings += 1;
        if (a.status === 'COMPLETED') {
          record.completedBookings += 1;
          record.totalSpent += a.servicePrice;
        } else if (a.status === 'CANCELLED') {
          record.cancelledBookings += 1;
        }
      }

      let customers = Array.from(customerMap.values());

      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.firstName.toLowerCase().includes(query) ||
            c.lastName.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            (c.phone && c.phone.includes(query))
        );
      }

      res.json(customers);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
