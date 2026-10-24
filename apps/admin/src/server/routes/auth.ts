import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { config } from '../config';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import { LoginSchema, RegisterSchema, normalizePhone, parseFullName, isValidPhone } from '@chairly/shared';
import { UserRole } from '@prisma/client';

const router = Router();

// In-memory rate limiting map for login protection
interface LoginAttempt {
  attempts: number;
  lockedUntil?: number;
}
const loginRateLimit = new Map<string, LoginAttempt>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string) {
  const now = Date.now();
  const record = loginRateLimit.get(key);
  if (!record) return;

  if (record.lockedUntil && record.lockedUntil > now) {
    const minutesRemaining = Math.ceil((record.lockedUntil - now) / 60000);
    throw new AppError(
      `Juda ko'p muvaffaqiyatsiz urinishlar. Iltimos ${minutesRemaining} daqiqadan so'ng qayta urinib ko'ring.`,
      429
    );
  }

  // Lock expired
  if (record.lockedUntil && record.lockedUntil <= now) {
    loginRateLimit.delete(key);
  }
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = loginRateLimit.get(key) || { attempts: 0 };
  record.attempts += 1;
  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginRateLimit.set(key, record);
}

function resetRateLimit(key: string) {
  loginRateLimit.delete(key);
}

/**
 * Customer Registration
 * Required fields: fullName, phone, password
 * Default role: CUSTOMER
 */
router.post('/register', validateBody(RegisterSchema), async (req: Request, res: Response, next) => {
  try {
    const { fullName, phone, password, firstName, lastName, email } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      throw new AppError("Telefon raqami formati noto'g'ri (masalan: +998 90 123 45 67)", 400);
    }

    // Check phone uniqueness
    const existingPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existingPhone) {
      throw new AppError("Ushbu telefon raqami bilan hisob allaqachon mavjud", 400);
    }

    // Check email uniqueness if provided
    let cleanEmail: string | undefined = undefined;
    if (email && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      const existingEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        throw new AppError("Ushbu email bilan hisob allaqachon mavjud", 400);
      }
    }

    // Name splitting
    let parsedFirst = firstName?.trim();
    let parsedLast = lastName?.trim();
    if (!parsedFirst && fullName) {
      const split = parseFullName(fullName);
      parsedFirst = split.firstName;
      parsedLast = split.lastName;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: cleanEmail || null,
        passwordHash,
        firstName: parsedFirst || 'Mijoz',
        lastName: parsedLast || '',
        role: UserRole.CUSTOMER, // Public registration is ALWAYS customer
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email || '', phone: user.phone, role: user.role },
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

/**
 * Universal Login: Authenticates with Phone Number or Email + Password
 */
router.post('/login', validateBody(LoginSchema), async (req: Request, res: Response, next) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const rawIdentifier = (identifier || phone || email || '').trim();

    if (!rawIdentifier) {
      throw new AppError("Telefon raqami yoki parolni kiriting", 400);
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}_${rawIdentifier.toLowerCase()}`;
    checkRateLimit(rateLimitKey);

    let user: any = null;

    if (rawIdentifier.includes('@')) {
      // Email-based lookup (e.g. platform owner admin@chairly.app)
      user = await prisma.user.findUnique({
        where: { email: rawIdentifier.toLowerCase() },
        include: {
          memberships: {
            include: {
              shop: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
    } else {
      // Phone-based lookup
      const normalizedPhone = normalizePhone(rawIdentifier);
      user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        include: {
          memberships: {
            include: {
              shop: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
    }

    if (!user) {
      recordFailedLogin(rateLimitKey);
      // Generic non-revealing error
      throw new AppError("Telefon raqami yoki parol noto'g'ri", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      recordFailedLogin(rateLimitKey);
      throw new AppError("Telefon raqami yoki parol noto'g'ri", 401);
    }

    resetRateLimit(rateLimitKey);

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email || '', phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    let memberships = user.memberships.map((m: any) => ({
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
      const existingShopIds = new Set(memberships.map((m: any) => m.shopId));
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
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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

    let memberships = user.memberships.map((m: any) => ({
      shopId: m.shopId,
      shopName: m.shop.name,
      role: m.role,
    }));

    if (user.role === 'OWNER') {
      const allShops = await prisma.shop.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      const existingShopIds = new Set(memberships.map((m: any) => m.shopId));
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
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
    const { firstName, lastName, fullName, phone, avatarUrl } = req.body;

    let updatedFirst = firstName;
    let updatedLast = lastName;

    if (fullName && typeof fullName === 'string') {
      const split = parseFullName(fullName);
      updatedFirst = split.firstName;
      updatedLast = split.lastName;
    }

    let normalizedPhone: string | undefined = undefined;
    if (phone !== undefined && phone !== null && phone.trim().length > 0) {
      normalizedPhone = normalizePhone(phone);
      if (!isValidPhone(normalizedPhone)) {
        throw new AppError("Telefon raqami formati noto'g'ri", 400);
      }
      // Check phone uniqueness against other users
      const existing = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
          id: { not: req.user!.userId },
        },
      });
      if (existing) {
        throw new AppError("Ushbu telefon raqami boshqa hisobga biriktirilgan", 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(updatedFirst ? { firstName: updatedFirst.trim() } : {}),
        ...(updatedLast !== undefined ? { lastName: updatedLast.trim() } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl?.trim() || null } : {}),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
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

router.put('/password', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError("Joriy parol va yangi parol kiritilishi shart", 400);
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new AppError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Joriy parol noto'g'ri", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
  } catch (err) {
    next(err);
  }
});

export default router;
