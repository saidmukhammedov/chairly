import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { config } from '../config';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import { LoginSchema, RegisterSchema } from '@chairly/shared';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/register', validateBody(RegisterSchema), async (req: Request, res: Response, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: UserRole.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      tokens: { accessToken },
      memberships: [],
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateBody(LoginSchema), async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            shop: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    let memberships = user.memberships.map((m) => ({
      shopId: m.shopId,
      shopName: m.shop.name,
      role: m.role,
    }));

    // If website platform super-admin/owner (role OWNER in database), grant access to all active shops
    if (user.role === 'OWNER') {
      const allShops = await prisma.shop.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      const existingShopIds = new Set(memberships.map((m) => m.shopId));
      for (const s of allShops) {
        if (!existingShopIds.has(s.id)) {
          memberships.push({
            shopId: s.id,
            shopName: s.name,
            role: 'OWNER',
          });
        }
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      tokens: { accessToken },
      memberships,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        memberships: {
          include: {
            shop: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let memberships = user.memberships.map((m) => ({
      shopId: m.shopId,
      shopName: m.shop.name,
      role: m.role,
    }));

    // If website platform super-admin/owner (role OWNER in database), grant access to all active shops
    if (user.role === 'OWNER') {
      const allShops = await prisma.shop.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      const existingShopIds = new Set(memberships.map((m) => m.shopId));
      for (const s of allShops) {
        if (!existingShopIds.has(s.id)) {
          memberships.push({
            shopId: s.id,
            shopName: s.name,
            role: 'OWNER',
          });
        }
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      memberships,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/profile', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
