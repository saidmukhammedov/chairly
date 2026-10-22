import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireShopMember } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import { ShopSettingsSchema } from '@chairly/shared';

const router = Router();

// Get shop settings
router.get(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: { workingHours: { orderBy: { dayOfWeek: 'asc' } } },
      });

      if (!shop) {
        throw new AppError('Shop not found', 404);
      }

      res.json(shop);
    } catch (err) {
      next(err);
    }
  }
);

// Update shop settings
router.put(
  '/shop/:shopId',
  authenticate,
  requireShopMember(['OWNER']),
  validateBody(ShopSettingsSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const updated = await prisma.shop.update({
        where: { id: shopId },
        data: req.body,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Update shop working hours
router.put(
  '/shop/:shopId/hours',
  authenticate,
  requireShopMember(['OWNER', 'MANAGER']),
  async (req: Request, res: Response, next) => {
    try {
      const { shopId } = req.params;
      const { workingHours } = req.body;

      if (!Array.isArray(workingHours)) {
        throw new AppError('workingHours must be an array', 400);
      }

      await prisma.$transaction(async (tx) => {
        for (const item of workingHours) {
          await tx.shopWorkingHour.upsert({
            where: {
              shopId_dayOfWeek: {
                shopId,
                dayOfWeek: item.dayOfWeek,
              },
            },
            update: {
              openTime: item.openTime,
              closeTime: item.closeTime,
              isClosed: item.isClosed,
            },
            create: {
              shopId,
              dayOfWeek: item.dayOfWeek,
              openTime: item.openTime,
              closeTime: item.closeTime,
              isClosed: item.isClosed,
            },
          });
        }
      });

      res.json({ message: 'Working hours updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
