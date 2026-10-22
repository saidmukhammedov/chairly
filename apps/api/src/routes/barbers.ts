import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireShopMember } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import { BarberSchema } from '@chairly/shared';

const router = Router();

// List barbers for a shop
router.get('/shop/:shopId', async (req: Request, res: Response, next) => {
  try {
    const { shopId } = req.params;
    const barbers = await prisma.barberProfile.findMany({
      where: { shopId },
      include: {
        services: { select: { serviceId: true } },
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        breaks: { orderBy: { startTime: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(
      barbers.map((b) => ({
        id: b.id,
        shopId: b.shopId,
        userId: b.userId,
        name: b.name,
        bio: b.bio,
        avatarUrl: b.avatarUrl,
        specialty: b.specialty,
        isActive: b.isActive,
        serviceIds: b.services.map((bs) => bs.serviceId),
        schedules: b.schedules,
        breaks: b.breaks,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Create barber (Shop Owner / Manager)
router.post(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  validateBody(BarberSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const { name, bio, avatarUrl, specialty, isActive, serviceIds } = req.body;

      const barber = await prisma.$transaction(async (tx) => {
        const created = await tx.barberProfile.create({
          data: {
            shopId,
            name,
            bio,
            avatarUrl,
            specialty,
            isActive: isActive !== undefined ? isActive : true,
          },
        });

        // Initialize default working schedule (09:00 - 18:00, Mon-Sat)
        for (let day = 0; day <= 6; day++) {
          await tx.barberSchedule.create({
            data: {
              barberId: created.id,
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '18:00',
              isWorking: day !== 0,
            },
          });
        }

        if (serviceIds && serviceIds.length > 0) {
          await tx.barberService.createMany({
            data: serviceIds.map((sId: string) => ({
              barberId: created.id,
              serviceId: sId,
            })),
          });
        }

        return created;
      });

      res.status(201).json(barber);
    } catch (err) {
      next(err);
    }
  }
);

// Update barber (Shop Owner / Manager)
router.put(
  '/shop/:shopId/:barberId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  validateBody(BarberSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId, barberId } = req.params;
      const { name, bio, avatarUrl, specialty, isActive, serviceIds } = req.body;

      const existing = await prisma.barberProfile.findFirst({
        where: { id: barberId, shopId },
      });

      if (!existing) {
        throw new AppError('Barber not found in this shop', 404);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.barberProfile.update({
          where: { id: barberId },
          data: {
            name,
            bio,
            avatarUrl,
            specialty,
            isActive,
          },
        });

        if (serviceIds) {
          await tx.barberService.deleteMany({ where: { barberId } });
          if (serviceIds.length > 0) {
            await tx.barberService.createMany({
              data: serviceIds.map((sId: string) => ({
                barberId,
                serviceId: sId,
              })),
            });
          }
        }

        return b;
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Update barber schedule (Shop Owner / Manager)
router.put(
  '/shop/:shopId/:barberId/schedule',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId, barberId } = req.params;
      const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime, isWorking }

      if (!Array.isArray(schedules)) {
        throw new AppError('Schedules must be an array', 400);
      }

      const existing = await prisma.barberProfile.findFirst({
        where: { id: barberId, shopId },
      });

      if (!existing) {
        throw new AppError('Barber not found in this shop', 404);
      }

      await prisma.$transaction(async (tx) => {
        for (const s of schedules) {
          await tx.barberSchedule.upsert({
            where: {
              barberId_dayOfWeek: {
                barberId,
                dayOfWeek: s.dayOfWeek,
              },
            },
            update: {
              startTime: s.startTime,
              endTime: s.endTime,
              isWorking: s.isWorking,
            },
            create: {
              barberId,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              isWorking: s.isWorking,
            },
          });
        }
      });

      res.json({ message: 'Schedule updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
