import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireShopMember } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import { ServiceSchema } from '@chairly/shared';

const router = Router();

// Get services for a shop
router.get('/shop/:shopId', async (req: Request, res: Response, next) => {
  try {
    const { shopId } = req.params;
    const services = await prisma.service.findMany({
      where: { shopId },
      include: {
        barbers: {
          select: { barberId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(
      services.map((s) => ({
        ...s,
        barberIds: s.barbers.map((b) => b.barberId),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Create service (Shop Manager / Owner only)
router.post(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  validateBody(ServiceSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const { name, description, category, price, durationMinutes, bufferMinutes, isActive, barberIds } = req.body;

      const service = await prisma.$transaction(async (tx) => {
        const created = await tx.service.create({
          data: {
            shopId,
            name,
            description,
            category,
            price,
            durationMinutes,
            bufferMinutes,
            isActive: isActive !== undefined ? isActive : true,
          },
        });

        if (barberIds && barberIds.length > 0) {
          await tx.barberService.createMany({
            data: barberIds.map((bId: string) => ({
              barberId: bId,
              serviceId: created.id,
            })),
          });
        }

        return created;
      });

      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

// Update service (Shop Manager / Owner only)
router.put(
  '/shop/:shopId/:serviceId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  validateBody(ServiceSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId, serviceId } = req.params;
      const { name, description, category, price, durationMinutes, bufferMinutes, isActive, barberIds } = req.body;

      const existing = await prisma.service.findFirst({
        where: { id: serviceId, shopId },
      });

      if (!existing) {
        throw new AppError('Service not found for this barbershop', 404);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const s = await tx.service.update({
          where: { id: serviceId },
          data: {
            name,
            description,
            category,
            price,
            durationMinutes,
            bufferMinutes,
            isActive,
          },
        });

        if (barberIds) {
          await tx.barberService.deleteMany({ where: { serviceId } });
          if (barberIds.length > 0) {
            await tx.barberService.createMany({
              data: barberIds.map((bId: string) => ({
                barberId: bId,
                serviceId,
              })),
            });
          }
        }

        return s;
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
