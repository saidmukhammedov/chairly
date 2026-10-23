import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';
import { normalizePhone } from '@chairly/shared';

const router = Router();

/**
 * Get notifications:
 * If authenticated: by userId OR phone
 * If not authenticated: by query parameter ?phone=...
 */
router.get('/', optionalAuthenticate, async (req: Request, res: Response, next) => {
  try {
    let whereClause: any = {};

    if (req.user) {
      const orConditions: any[] = [{ userId: req.user.userId }];
      if (req.user.phone) {
        orConditions.push({ phone: req.user.phone });
      }
      whereClause = { OR: orConditions };
    } else {
      const { phone } = req.query;
      if (!phone || typeof phone !== 'string') {
        return res.json({ notifications: [], unreadCount: 0 });
      }
      const norm = normalizePhone(phone);
      whereClause = { phone: norm };
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        isRead: false,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Mark a single notification as read
 */
router.patch('/:id/read', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw new AppError("Xabarnoma topilmadi", 404);
    }

    // Ensure notification belongs to user or user's phone
    if (notif.userId && notif.userId !== req.user!.userId && notif.phone !== req.user!.phone) {
      throw new AppError("Ruxsat berilmadi", 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * Mark all notifications as read for current user
 */
router.post('/read-all', authenticate, async (req: Request, res: Response, next) => {
  try {
    const orConditions: any[] = [{ userId: req.user!.userId }];
    if (req.user!.phone) {
      orConditions.push({ phone: req.user!.phone });
    }

    await prisma.notification.updateMany({
      where: {
        OR: orConditions,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ success: true, message: "Barcha xabarnomalar o'qilgan deb belgilandi" });
  } catch (err) {
    next(err);
  }
});

export default router;
