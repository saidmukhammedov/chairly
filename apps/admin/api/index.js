// src/server/app.ts
import express from "express";
import cors from "cors";

// src/server/middlewares/errorHandler.ts
import { ZodError } from "zod";
var AppError = class _AppError extends Error {
  statusCode;
  details;
  constructor(message, statusCode = 400, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, _AppError.prototype);
  }
};
var errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message
      }))
    });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }
  if (err.name === "ConflictError") {
    return res.status(409).json({
      error: err.message || "Slot is no longer available"
    });
  }
  console.error("[API Error]:", err);
  const isProd = process.env.NODE_ENV === "production";
  return res.status(err.statusCode || 500).json({
    error: isProd ? "An internal server error occurred" : err.message || "Internal Server Error",
    ...isProd ? {} : { stack: err.stack }
  });
};

// src/server/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";

// src/server/db.ts
import { PrismaClient } from "@prisma/client";

// src/server/config/index.ts
import dotenv from "dotenv";
dotenv.config();
var config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "production",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public",
  jwtSecret: process.env.JWT_SECRET || "chairly_production_jwt_secret_key_98372619472938",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  defaultTimezone: process.env.DEFAULT_TIMEZONE || "Asia/Tashkent",
  defaultCurrency: process.env.DEFAULT_CURRENCY || "UZS"
};

// src/server/db.ts
var prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl
    }
  },
  log: ["warn", "error"]
});

// src/server/middlewares/auth.ts
import jwt from "jsonwebtoken";
var authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required. Missing Bearer token.", 401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Invalid token format", 401);
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      next(new AppError("Invalid or expired authentication token", 401));
    } else {
      next(err);
    }
  }
};
var optionalAuthenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch {
  }
  next();
};
var requireShopMember = (allowedRoles = ["OWNER", "MANAGER", "BARBER"]) => {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }
      const shopId = req.params.shopId || req.body.shopId || req.query.shopId;
      if (!shopId) {
        throw new AppError("Shop ID is required for shop operations", 400);
      }
      if (req.user.email === "admin@chairly.app") {
        req.shopMembership = {
          shopId,
          role: "OWNER"
        };
        return next();
      }
      const membership = await prisma.shopMember.findUnique({
        where: {
          shopId_userId: {
            shopId,
            userId: req.user.userId
          }
        }
      });
      if (!membership || !allowedRoles.includes(membership.role)) {
        throw new AppError("You do not have permission to manage this barbershop", 403);
      }
      req.shopMembership = {
        shopId: membership.shopId,
        role: membership.role
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};
var requirePlatformOwner = async (req, _res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true }
    });
    if (!user || user.role !== "OWNER" || user.email !== "admin@chairly.app") {
      throw new AppError("Platform Owner access required for this action", 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

// src/server/middlewares/validate.ts
var validateBody = (schema) => {
  return async (req, _res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};
var validateQuery = (schema) => {
  return async (req, _res, next) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
};

// ../../packages/shared/src/constants/index.ts
var APPOINTMENT_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW"
};
var ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  // Final state
  CANCELLED: [],
  // Final state
  NO_SHOW: []
  // Final state
};
var ACTIVE_APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS"
];

// ../../packages/shared/src/schemas/index.ts
import { z } from "zod";
var RegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional().nullable()
});
var LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});
var CreateBookingSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  serviceId: z.string().uuid("Invalid service ID"),
  barberId: z.string().uuid("Invalid barber ID").optional().nullable(),
  // Optional if user selected "Any available barber"
  startTime: z.string().datetime({ message: "Start time must be a valid ISO 8601 string" }),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable()
});
var RescheduleBookingSchema = z.object({
  newStartTime: z.string().datetime({ message: "New start time must be a valid ISO 8601 string" }),
  barberId: z.string().uuid("Invalid barber ID").optional()
});
var CancelBookingSchema = z.object({
  reason: z.string().max(300).optional().nullable()
});
var UpdateStatusSchema = z.object({
  status: z.nativeEnum(APPOINTMENT_STATUSES, {
    errorMap: () => ({ message: "Invalid appointment status" })
  }),
  notes: z.string().optional().nullable()
});
var GetAvailabilityQuerySchema = z.object({
  shopId: z.string().uuid(),
  serviceId: z.string().uuid(),
  barberId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD")
});
var ServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.string().min(2).max(50).default("Haircut"),
  price: z.number().int().nonnegative("Price must be a positive integer"),
  durationMinutes: z.number().int().min(5, "Duration must be at least 5 minutes").max(360),
  bufferMinutes: z.number().int().min(0).max(60).default(5),
  isActive: z.boolean().default(true),
  barberIds: z.array(z.string().uuid()).optional()
});
var BarberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  specialty: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string().uuid()).optional()
});
var ShopSettingsSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1e3),
  phone: z.string().min(5).max(30),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  logoUrl: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  timezone: z.string().default("Asia/Tashkent"),
  currency: z.string().default("UZS"),
  leadTimeMinutes: z.number().int().min(0).default(30),
  horizonDays: z.number().int().min(1).max(90).default(30),
  cancelDeadlineHours: z.number().int().min(0).default(2),
  isActive: z.boolean().default(true)
});

// src/server/routes/auth.ts
import { UserRole } from "@prisma/client";
var router = Router();
router.post("/register", validateBody(RegisterSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 400);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: UserRole.CUSTOMER
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      }
    });
    const accessToken = jwt2.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      user,
      tokens: { accessToken },
      memberships: []
    });
  } catch (err) {
    next(err);
  }
});
router.post("/login", validateBody(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            shop: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }
    const accessToken = jwt2.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: "7d" }
    );
    let memberships = user.memberships.map((m) => ({
      shopId: m.shopId,
      shopName: m.shop.name,
      role: m.role
    }));
    if (user.email === "admin@chairly.app") {
      const allShops = await prisma.shop.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      });
      const existingShopIds = new Set(memberships.map((m) => m.shopId));
      for (const s of allShops) {
        if (!existingShopIds.has(s.id)) {
          memberships.push({
            shopId: s.id,
            shopName: s.name,
            role: "OWNER"
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
        createdAt: user.createdAt
      },
      tokens: { accessToken },
      memberships
    });
  } catch (err) {
    next(err);
  }
});
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        memberships: {
          include: {
            shop: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    let memberships = user.memberships.map((m) => ({
      shopId: m.shopId,
      shopName: m.shop.name,
      role: m.role
    }));
    if (user.email === "admin@chairly.app") {
      const allShops = await prisma.shop.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      });
      const existingShopIds = new Set(memberships.map((m) => m.shopId));
      for (const s of allShops) {
        if (!existingShopIds.has(s.id)) {
          memberships.push({
            shopId: s.id,
            shopName: s.name,
            role: "OWNER"
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
        createdAt: user.createdAt
      },
      memberships
    });
  } catch (err) {
    next(err);
  }
});
router.put("/profile", authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatarUrl } = req.body;
    if (firstName !== void 0 && (typeof firstName !== "string" || firstName.trim().length === 0)) {
      throw new AppError("First name cannot be empty", 400);
    }
    if (lastName !== void 0 && (typeof lastName !== "string" || lastName.trim().length === 0)) {
      throw new AppError("Last name cannot be empty", 400);
    }
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...firstName ? { firstName: firstName.trim() } : {},
        ...lastName ? { lastName: lastName.trim() } : {},
        ...phone !== void 0 ? { phone: phone?.trim() || null } : {},
        ...avatarUrl !== void 0 ? { avatarUrl: avatarUrl?.trim() || null } : {}
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      }
    });
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});
router.put("/password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError("Both current password and new password are required", 400);
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters long", 400);
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Current password is incorrect", 400);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
});
var auth_default = router;

// src/server/routes/shops.ts
import { Router as Router2 } from "express";
import bcrypt2 from "bcryptjs";
var router2 = Router2();
function generateSlug(name) {
  const base = name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  return base || "shop-" + Math.random().toString(36).substring(2, 7);
}
router2.get("/manage/all", authenticate, requirePlatformOwner, async (_req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        _count: {
          select: {
            barbers: true,
            services: true,
            appointments: true,
            members: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true
              }
            }
          }
        },
        services: {
          select: { price: true },
          orderBy: { price: "asc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const formatted = shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      phone: s.phone,
      address: s.address,
      city: s.city,
      logoUrl: s.logoUrl,
      coverImageUrl: s.coverImageUrl,
      currency: s.currency,
      timezone: s.timezone,
      isActive: s.isActive,
      leadTimeMinutes: s.leadTimeMinutes,
      horizonDays: s.horizonDays,
      cancelDeadlineHours: s.cancelDeadlineHours,
      createdAt: s.createdAt,
      startingPrice: s.services[0]?.price || 0,
      counts: s._count,
      admins: s.members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user
      }))
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});
router2.post("/", authenticate, requirePlatformOwner, async (req, res, next) => {
  try {
    const {
      name,
      slug: customSlug,
      description,
      phone,
      address,
      city,
      logoUrl,
      coverImageUrl,
      currency = "UZS",
      timezone = "Asia/Tashkent",
      isActive = true,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      adminPhone
    } = req.body;
    if (!name || !name.trim()) {
      throw new AppError("Barbershop name is required", 400);
    }
    if (!address || !address.trim()) {
      throw new AppError("Address is required", 400);
    }
    if (!city || !city.trim()) {
      throw new AppError("City is required", 400);
    }
    if (!phone || !phone.trim()) {
      throw new AppError("Phone number is required", 400);
    }
    let baseSlug = customSlug && customSlug.trim() ? generateSlug(customSlug) : generateSlug(name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.shop.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    const shop = await prisma.$transaction(async (tx) => {
      const createdShop = await tx.shop.create({
        data: {
          name: name.trim(),
          slug: uniqueSlug,
          description: description?.trim() || "Premium barbershop in " + city.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          logoUrl: logoUrl?.trim() || null,
          coverImageUrl: coverImageUrl?.trim() || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
          currency,
          timezone,
          isActive: Boolean(isActive)
        }
      });
      const defaultWorkingHours = [
        { dayOfWeek: 0, openTime: "10:00", closeTime: "18:00", isClosed: false },
        { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false }
      ];
      for (const wh of defaultWorkingHours) {
        await tx.shopWorkingHour.create({
          data: {
            shopId: createdShop.id,
            ...wh
          }
        });
      }
      if (adminEmail && adminEmail.trim()) {
        const cleanEmail = adminEmail.trim().toLowerCase();
        let adminUser = await tx.user.findUnique({ where: { email: cleanEmail } });
        if (!adminUser) {
          const pass = adminPassword || "chairly123";
          const passwordHash = await bcrypt2.hash(pass, 10);
          adminUser = await tx.user.create({
            data: {
              email: cleanEmail,
              passwordHash,
              firstName: adminFirstName?.trim() || "Shop",
              lastName: adminLastName?.trim() || "Admin",
              phone: adminPhone?.trim() || null,
              role: "MANAGER"
            }
          });
        }
        await tx.shopMember.create({
          data: {
            shopId: createdShop.id,
            userId: adminUser.id,
            role: "OWNER"
          }
        });
      }
      return createdShop;
    });
    res.status(201).json(shop);
  } catch (err) {
    next(err);
  }
});
router2.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isPlatformOwner = req.user.email === "admin@chairly.app";
    if (!isPlatformOwner) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: id, userId } }
      });
      if (!membership || membership.role !== "OWNER") {
        throw new AppError("Only the shop owner or platform administrator can edit this barbershop", 403);
      }
    }
    const {
      name,
      description,
      phone,
      address,
      city,
      logoUrl,
      coverImageUrl,
      currency,
      timezone,
      isActive,
      leadTimeMinutes,
      horizonDays,
      cancelDeadlineHours
    } = req.body;
    const updated = await prisma.shop.update({
      where: { id },
      data: {
        ...name ? { name: name.trim() } : {},
        ...description !== void 0 ? { description: description.trim() } : {},
        ...phone ? { phone: phone.trim() } : {},
        ...address ? { address: address.trim() } : {},
        ...city ? { city: city.trim() } : {},
        ...logoUrl !== void 0 ? { logoUrl: logoUrl?.trim() || null } : {},
        ...coverImageUrl !== void 0 ? { coverImageUrl: coverImageUrl?.trim() || null } : {},
        ...currency ? { currency } : {},
        ...timezone ? { timezone } : {},
        ...isActive !== void 0 ? { isActive: Boolean(isActive) } : {},
        ...leadTimeMinutes !== void 0 ? { leadTimeMinutes: Number(leadTimeMinutes) } : {},
        ...horizonDays !== void 0 ? { horizonDays: Number(horizonDays) } : {},
        ...cancelDeadlineHours !== void 0 ? { cancelDeadlineHours: Number(cancelDeadlineHours) } : {}
      }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router2.patch("/:id/status", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const isPlatformOwner = req.user.email === "admin@chairly.app";
    if (!isPlatformOwner) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: id, userId: req.user.userId } }
      });
      if (!membership || membership.role !== "OWNER") {
        throw new AppError("Permission denied", 403);
      }
    }
    const updated = await prisma.shop.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: { id: true, name: true, isActive: true }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router2.post("/:id/admins", authenticate, requirePlatformOwner, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, password, role = "OWNER" } = req.body;
    if (!email || !email.trim()) {
      throw new AppError("Email is required", 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      const pass = password || "chairly123";
      const passwordHash = await bcrypt2.hash(pass, 10);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          firstName: firstName?.trim() || "Shop",
          lastName: lastName?.trim() || "Admin",
          phone: phone?.trim() || null,
          role: "MANAGER"
        }
      });
    }
    const membership = await prisma.shopMember.upsert({
      where: {
        shopId_userId: { shopId: id, userId: user.id }
      },
      update: { role },
      create: {
        shopId: id,
        userId: user.id,
        role
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true }
        }
      }
    });
    res.json(membership);
  } catch (err) {
    next(err);
  }
});
router2.delete("/:id/admins/:userId", authenticate, requirePlatformOwner, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    await prisma.shopMember.delete({
      where: {
        shopId_userId: { shopId: id, userId }
      }
    });
    res.json({ message: "Administrator removed from shop" });
  } catch (err) {
    next(err);
  }
});
router2.get("/", optionalAuthenticate, async (req, res, next) => {
  try {
    const { search, category, city } = req.query;
    const currentUserId = req.user?.userId;
    const whereClause = { isActive: true };
    if (search && typeof search === "string") {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } }
      ];
    }
    if (city && typeof city === "string") {
      whereClause.city = { contains: city, mode: "insensitive" };
    }
    if (category && typeof category === "string" && category !== "All") {
      whereClause.services = {
        some: {
          category: { equals: category, mode: "insensitive" },
          isActive: true
        }
      };
    }
    const shops = await prisma.shop.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
          select: { price: true },
          orderBy: { price: "asc" },
          take: 1
        },
        favorites: currentUserId ? {
          where: { userId: currentUserId }
        } : false
      },
      orderBy: { name: "asc" }
    });
    const formatted = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      phone: shop.phone,
      address: shop.address,
      city: shop.city,
      logoUrl: shop.logoUrl,
      coverImageUrl: shop.coverImageUrl,
      timezone: shop.timezone,
      currency: shop.currency,
      isActive: shop.isActive,
      startingPrice: shop.services[0]?.price || 0,
      rating: 4.9,
      // Verified review score for seed shops
      reviewCount: 48,
      isFavorited: currentUserId ? (shop.favorites?.length || 0) > 0 : false
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});
router2.get("/:idOrSlug", optionalAuthenticate, async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const currentUserId = req.user?.userId;
    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      },
      include: {
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        services: {
          where: { isActive: true },
          orderBy: { price: "asc" }
        },
        barbers: {
          where: { isActive: true },
          include: {
            services: { select: { serviceId: true } }
          }
        },
        favorites: currentUserId ? { where: { userId: currentUserId } } : false
      }
    });
    if (!shop) {
      throw new AppError("Barbershop not found", 404);
    }
    const startingPrice = shop.services.length > 0 ? shop.services[0].price : 0;
    res.json({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      phone: shop.phone,
      address: shop.address,
      city: shop.city,
      logoUrl: shop.logoUrl,
      coverImageUrl: shop.coverImageUrl,
      timezone: shop.timezone,
      currency: shop.currency,
      leadTimeMinutes: shop.leadTimeMinutes,
      horizonDays: shop.horizonDays,
      cancelDeadlineHours: shop.cancelDeadlineHours,
      isActive: shop.isActive,
      startingPrice,
      rating: 4.9,
      reviewCount: 48,
      isFavorited: currentUserId ? (shop.favorites?.length || 0) > 0 : false,
      workingHours: shop.workingHours,
      services: shop.services,
      barbers: shop.barbers.map((b) => ({
        id: b.id,
        shopId: b.shopId,
        userId: b.userId,
        name: b.name,
        bio: b.bio,
        avatarUrl: b.avatarUrl,
        specialty: b.specialty,
        isActive: b.isActive,
        serviceIds: b.services.map((bs) => bs.serviceId)
      }))
    });
  } catch (err) {
    next(err);
  }
});
router2.post("/:id/favorite", authenticate, async (req, res, next) => {
  try {
    const shopId = req.params.id;
    const userId = req.user.userId;
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_shopId: { userId, shopId }
      }
    });
    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return res.json({ favorited: false });
    } else {
      await prisma.favorite.create({
        data: { userId, shopId }
      });
      return res.json({ favorited: true });
    }
  } catch (err) {
    next(err);
  }
});
router2.get("/user/favorites", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        shop: {
          include: {
            services: {
              where: { isActive: true },
              select: { price: true },
              orderBy: { price: "asc" },
              take: 1
            }
          }
        }
      }
    });
    const result = favorites.map((f) => ({
      id: f.shop.id,
      name: f.shop.name,
      slug: f.shop.slug,
      description: f.shop.description,
      phone: f.shop.phone,
      address: f.shop.address,
      city: f.shop.city,
      logoUrl: f.shop.logoUrl,
      coverImageUrl: f.shop.coverImageUrl,
      timezone: f.shop.timezone,
      currency: f.shop.currency,
      isActive: f.shop.isActive,
      startingPrice: f.shop.services[0]?.price || 0,
      isFavorited: true
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});
var shops_default = router2;

// src/server/routes/services.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.get("/shop/:shopId", async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const services = await prisma.service.findMany({
      where: { shopId },
      include: {
        barbers: {
          select: { barberId: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    res.json(
      services.map((s) => ({
        ...s,
        barberIds: s.barbers.map((b) => b.barberId)
      }))
    );
  } catch (err) {
    next(err);
  }
});
router3.post(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  validateBody(ServiceSchema),
  async (req, res, next) => {
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
            isActive: isActive !== void 0 ? isActive : true
          }
        });
        if (barberIds && barberIds.length > 0) {
          await tx.barberService.createMany({
            data: barberIds.map((bId) => ({
              barberId: bId,
              serviceId: created.id
            }))
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
router3.put(
  "/shop/:shopId/:serviceId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  validateBody(ServiceSchema),
  async (req, res, next) => {
    try {
      const { shopId, serviceId } = req.params;
      const { name, description, category, price, durationMinutes, bufferMinutes, isActive, barberIds } = req.body;
      const existing = await prisma.service.findFirst({
        where: { id: serviceId, shopId }
      });
      if (!existing) {
        throw new AppError("Service not found for this barbershop", 404);
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
            isActive
          }
        });
        if (barberIds) {
          await tx.barberService.deleteMany({ where: { serviceId } });
          if (barberIds.length > 0) {
            await tx.barberService.createMany({
              data: barberIds.map((bId) => ({
                barberId: bId,
                serviceId
              }))
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
var services_default = router3;

// src/server/routes/barbers.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/shop/:shopId", async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const barbers = await prisma.barberProfile.findMany({
      where: { shopId },
      include: {
        services: { select: { serviceId: true } },
        schedules: { orderBy: { dayOfWeek: "asc" } },
        breaks: { orderBy: { startTime: "asc" } }
      },
      orderBy: { createdAt: "asc" }
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
        breaks: b.breaks
      }))
    );
  } catch (err) {
    next(err);
  }
});
router4.post(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  validateBody(BarberSchema),
  async (req, res, next) => {
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
            isActive: isActive !== void 0 ? isActive : true
          }
        });
        for (let day = 0; day <= 6; day++) {
          await tx.barberSchedule.create({
            data: {
              barberId: created.id,
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "18:00",
              isWorking: day !== 0
            }
          });
        }
        if (serviceIds && serviceIds.length > 0) {
          await tx.barberService.createMany({
            data: serviceIds.map((sId) => ({
              barberId: created.id,
              serviceId: sId
            }))
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
router4.put(
  "/shop/:shopId/:barberId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  validateBody(BarberSchema),
  async (req, res, next) => {
    try {
      const { shopId, barberId } = req.params;
      const { name, bio, avatarUrl, specialty, isActive, serviceIds } = req.body;
      const existing = await prisma.barberProfile.findFirst({
        where: { id: barberId, shopId }
      });
      if (!existing) {
        throw new AppError("Barber not found in this shop", 404);
      }
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.barberProfile.update({
          where: { id: barberId },
          data: {
            name,
            bio,
            avatarUrl,
            specialty,
            isActive
          }
        });
        if (serviceIds) {
          await tx.barberService.deleteMany({ where: { barberId } });
          if (serviceIds.length > 0) {
            await tx.barberService.createMany({
              data: serviceIds.map((sId) => ({
                barberId,
                serviceId: sId
              }))
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
router4.put(
  "/shop/:shopId/:barberId/schedule",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  async (req, res, next) => {
    try {
      const { shopId, barberId } = req.params;
      const { schedules } = req.body;
      if (!Array.isArray(schedules)) {
        throw new AppError("Schedules must be an array", 400);
      }
      const existing = await prisma.barberProfile.findFirst({
        where: { id: barberId, shopId }
      });
      if (!existing) {
        throw new AppError("Barber not found in this shop", 404);
      }
      await prisma.$transaction(async (tx) => {
        for (const s of schedules) {
          await tx.barberSchedule.upsert({
            where: {
              barberId_dayOfWeek: {
                barberId,
                dayOfWeek: s.dayOfWeek
              }
            },
            update: {
              startTime: s.startTime,
              endTime: s.endTime,
              isWorking: s.isWorking
            },
            create: {
              barberId,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              isWorking: s.isWorking
            }
          });
        }
      });
      res.json({ message: "Schedule updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);
var barbers_default = router4;

// src/server/routes/availability.ts
import { Router as Router5 } from "express";

// src/server/utils/timezone.ts
import { format, isBefore, isAfter } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
function combineDateAndTimeInTimezone(dateStr, timeStr, timezone = "Asia/Tashkent") {
  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(dateTimeStr, timezone);
}
function formatTimeInTimezone(date, timezone = "Asia/Tashkent") {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, "HH:mm");
}
function intervalsOverlap(startA, endA, startB, endB) {
  return isBefore(startA, endB) && isAfter(endA, startB);
}

// src/server/services/availability.ts
import { addMinutes as addMinutes2, isAfter as isAfter2, isBefore as isBefore2 } from "date-fns";
import { toZonedTime as toZonedTime2 } from "date-fns-tz";
async function getAvailableSlots(options) {
  const { shopId, serviceId, barberId, dateStr } = options;
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      workingHours: true
    }
  });
  if (!shop || !shop.isActive) {
    throw new Error("Shop not found or inactive");
  }
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      barbers: {
        include: { barber: true }
      }
    }
  });
  if (!service || !service.isActive || service.shopId !== shopId) {
    throw new Error("Service not found or not offered at this barbershop");
  }
  let eligibleBarberIds = [];
  if (barberId) {
    const eligible = service.barbers.some((bs) => bs.barberId === barberId && bs.barber.isActive);
    if (!eligible) {
      throw new Error("The selected barber does not offer this service or is unavailable");
    }
    eligibleBarberIds = [barberId];
  } else {
    eligibleBarberIds = service.barbers.filter((bs) => bs.barber.isActive).map((bs) => bs.barberId);
  }
  if (eligibleBarberIds.length === 0) {
    return [];
  }
  const midDay = combineDateAndTimeInTimezone(dateStr, "12:00", shop.timezone);
  const zonedMidDay = toZonedTime2(midDay, shop.timezone);
  const dayOfWeek = zonedMidDay.getDay();
  const shopHours = shop.workingHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!shopHours || shopHours.isClosed) {
    return [];
  }
  const shopOpenDate = combineDateAndTimeInTimezone(dateStr, shopHours.openTime, shop.timezone);
  const shopCloseDate = combineDateAndTimeInTimezone(dateStr, shopHours.closeTime, shop.timezone);
  const barbers = await prisma.barberProfile.findMany({
    where: {
      id: { in: eligibleBarberIds },
      isActive: true
    },
    include: {
      schedules: { where: { dayOfWeek } },
      breaks: { where: { dayOfWeek } },
      blockedTimes: {
        where: {
          startTime: { lte: shopCloseDate },
          endTime: { gte: shopOpenDate }
        }
      }
    }
  });
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      barberId: { in: eligibleBarberIds },
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
      startTime: { lte: shopCloseDate },
      bufferEndTime: { gte: shopOpenDate }
    }
  });
  const now = /* @__PURE__ */ new Date();
  const minBookingTime = addMinutes2(now, shop.leadTimeMinutes);
  const totalSlotMinutes = service.durationMinutes + service.bufferMinutes;
  const slotIntervalMinutes = 15;
  const resultSlots = [];
  let currentSlotStart = shopOpenDate;
  while (isBefore2(addMinutes2(currentSlotStart, service.durationMinutes), shopCloseDate) || currentSlotStart.getTime() + service.durationMinutes * 6e4 === shopCloseDate.getTime()) {
    const slotServiceEnd = addMinutes2(currentSlotStart, service.durationMinutes);
    const slotBufferEnd = addMinutes2(currentSlotStart, totalSlotMinutes);
    if (isAfter2(slotServiceEnd, shopCloseDate)) {
      break;
    }
    const timeLabel = formatTimeInTimezone(currentSlotStart, shop.timezone);
    const isoString = currentSlotStart.toISOString();
    if (isBefore2(currentSlotStart, minBookingTime)) {
      resultSlots.push({
        time: timeLabel,
        isoString,
        available: false,
        reason: "Too late to book or in the past"
      });
      currentSlotStart = addMinutes2(currentSlotStart, slotIntervalMinutes);
      continue;
    }
    let availableBarber = null;
    for (const barber of barbers) {
      const schedule = barber.schedules[0];
      if (!schedule || !schedule.isWorking) {
        continue;
      }
      const barberStart = combineDateAndTimeInTimezone(dateStr, schedule.startTime, shop.timezone);
      const barberEnd = combineDateAndTimeInTimezone(dateStr, schedule.endTime, shop.timezone);
      if (isBefore2(currentSlotStart, barberStart) || isAfter2(slotBufferEnd, barberEnd)) {
        continue;
      }
      const inBreak = barber.breaks.some((brk) => {
        const breakStart = combineDateAndTimeInTimezone(dateStr, brk.startTime, shop.timezone);
        const breakEnd = combineDateAndTimeInTimezone(dateStr, brk.endTime, shop.timezone);
        return intervalsOverlap(currentSlotStart, slotBufferEnd, breakStart, breakEnd);
      });
      if (inBreak) {
        continue;
      }
      const isBlocked = barber.blockedTimes.some((blk) => {
        return intervalsOverlap(currentSlotStart, slotBufferEnd, blk.startTime, blk.endTime);
      });
      if (isBlocked) {
        continue;
      }
      const hasConflict = existingAppointments.some((appt) => {
        if (appt.barberId !== barber.id) return false;
        return intervalsOverlap(currentSlotStart, slotBufferEnd, appt.startTime, appt.bufferEndTime);
      });
      if (!hasConflict) {
        availableBarber = barber;
        break;
      }
    }
    if (availableBarber) {
      resultSlots.push({
        time: timeLabel,
        isoString,
        startTime: isoString,
        available: true,
        barberId: availableBarber.id,
        barberName: availableBarber.name
      });
    } else {
      resultSlots.push({
        time: timeLabel,
        isoString,
        startTime: isoString,
        available: false,
        reason: "Barber is booked or unavailable"
      });
    }
    currentSlotStart = addMinutes2(currentSlotStart, slotIntervalMinutes);
  }
  return resultSlots;
}

// src/server/routes/availability.ts
var router5 = Router5();
router5.get("/", validateQuery(GetAvailabilityQuerySchema), async (req, res, next) => {
  try {
    const { shopId, serviceId, barberId, date } = req.query;
    const slots = await getAvailableSlots({
      shopId,
      serviceId,
      barberId: barberId || void 0,
      dateStr: date
    });
    res.json(slots);
  } catch (err) {
    next(err);
  }
});
var availability_default = router5;

// src/server/routes/appointments.ts
import { Router as Router6 } from "express";

// src/server/services/booking.ts
import { AppointmentStatus } from "@prisma/client";
import { addMinutes as addMinutes3, isBefore as isBefore3 } from "date-fns";
var ConflictError = class extends AppError {
  constructor(message = "The selected appointment slot is no longer available.") {
    super(message, 409);
    this.name = "ConflictError";
  }
};
function generateBookingReference() {
  const random = Math.floor(1e3 + Math.random() * 9e3);
  return `CH-${random}`;
}
async function createBooking(customerId, input) {
  const { shopId, serviceId, notes } = input;
  let requestedBarberId = input.barberId;
  const requestedStartTime = new Date(input.startTime);
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { workingHours: true }
  });
  if (!shop || !shop.isActive) {
    throw new AppError("Barbershop not found or inactive", 404);
  }
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      barbers: { include: { barber: true } }
    }
  });
  if (!service || !service.isActive || service.shopId !== shopId) {
    throw new AppError("Service is not available at this shop", 400);
  }
  const requestedEndTime = addMinutes3(requestedStartTime, service.durationMinutes);
  const requestedBufferEndTime = addMinutes3(requestedStartTime, service.durationMinutes + service.bufferMinutes);
  const now = /* @__PURE__ */ new Date();
  const minAllowedTime = addMinutes3(now, shop.leadTimeMinutes);
  if (isBefore3(requestedStartTime, minAllowedTime)) {
    throw new AppError(`Appointments must be booked at least ${shop.leadTimeMinutes} minutes in advance`, 400);
  }
  if (!requestedBarberId) {
    const eligibleBarbers = service.barbers.filter((b) => b.barber.isActive).map((b) => b.barberId);
    if (eligibleBarbers.length === 0) {
      throw new AppError("No barbers currently offer this service", 400);
    }
    requestedBarberId = eligibleBarbers[0];
  } else {
    const eligible = service.barbers.some(
      (b) => b.barberId === requestedBarberId && b.barber.isActive
    );
    if (!eligible) {
      throw new AppError("The selected barber is not available for this service", 400);
    }
  }
  const barberIdToLock = requestedBarberId;
  const appointment = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`barber_${barberIdToLock}`}))
    `;
    const lockedBarber = await tx.$queryRaw`
      SELECT id, name FROM "BarberProfile" WHERE id = ${barberIdToLock} FOR UPDATE
    `;
    if (!lockedBarber || lockedBarber.length === 0) {
      throw new AppError("Barber not found", 404);
    }
    const overlapping = await tx.appointment.findFirst({
      where: {
        barberId: barberIdToLock,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS
          ]
        },
        startTime: {
          lt: requestedBufferEndTime
        },
        bufferEndTime: {
          gt: requestedStartTime
        }
      }
    });
    if (overlapping) {
      throw new ConflictError(
        "This time slot was just booked by another customer. Please choose a different time slot."
      );
    }
    const blocked = await tx.barberBlockedTime.findFirst({
      where: {
        barberId: barberIdToLock,
        startTime: { lt: requestedBufferEndTime },
        endTime: { gt: requestedStartTime }
      }
    });
    if (blocked) {
      throw new ConflictError("The barber is not available during this time period.");
    }
    let bookingRef = generateBookingReference();
    let existingRef = await tx.appointment.findUnique({ where: { bookingReference: bookingRef } });
    while (existingRef) {
      bookingRef = generateBookingReference();
      existingRef = await tx.appointment.findUnique({ where: { bookingReference: bookingRef } });
    }
    const created = await tx.appointment.create({
      data: {
        bookingReference: bookingRef,
        shopId,
        barberId: barberIdToLock,
        customerId,
        serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        currency: shop.currency,
        status: AppointmentStatus.CONFIRMED,
        startTime: requestedStartTime,
        endTime: requestedEndTime,
        bufferEndTime: requestedBufferEndTime,
        notes: notes || null
      },
      include: {
        shop: true,
        barber: true,
        service: true,
        customer: true
      }
    });
    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: created.id,
        newStatus: AppointmentStatus.CONFIRMED,
        changedById: customerId,
        reason: "Initial customer booking"
      }
    });
    return created;
  });
  return appointment;
}
async function rescheduleBooking(appointmentId, userId, isStaff, input) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shop: true, barber: true }
  });
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }
  if (!isStaff && appointment.customerId !== userId) {
    throw new AppError("You are not authorized to reschedule this appointment", 403);
  }
  if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PENDING) {
    throw new AppError(`Cannot reschedule an appointment with status ${appointment.status}`, 400);
  }
  const targetBarberId = input.barberId || appointment.barberId;
  const newStartTime = new Date(input.newStartTime);
  const newEndTime = addMinutes3(newStartTime, appointment.serviceDuration);
  const newBufferEndTime = addMinutes3(newStartTime, appointment.serviceDuration + appointment.bufferMinutes);
  return await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`barber_${targetBarberId}`}))
    `;
    await tx.$queryRaw`
      SELECT id FROM "BarberProfile" WHERE id = ${targetBarberId} FOR UPDATE
    `;
    const overlapping = await tx.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        barberId: targetBarberId,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS
          ]
        },
        startTime: { lt: newBufferEndTime },
        bufferEndTime: { gt: newStartTime }
      }
    });
    if (overlapping) {
      throw new ConflictError("The requested new time slot is not available.");
    }
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        barberId: targetBarberId,
        startTime: newStartTime,
        endTime: newEndTime,
        bufferEndTime: newBufferEndTime
      },
      include: {
        shop: true,
        barber: true,
        service: true,
        customer: true
      }
    });
    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId,
        previousStatus: appointment.status,
        newStatus: appointment.status,
        changedById: userId,
        reason: "Rescheduled to new time slot"
      }
    });
    return updated;
  });
}
async function cancelBooking(appointmentId, userId, isStaff, reason) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shop: true }
  });
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }
  if (!isStaff && appointment.customerId !== userId) {
    throw new AppError("You are not authorized to cancel this appointment", 403);
  }
  if (appointment.status === AppointmentStatus.CANCELLED) {
    throw new AppError("Appointment is already cancelled", 400);
  }
  if (appointment.status === AppointmentStatus.COMPLETED) {
    throw new AppError("Completed appointments cannot be cancelled", 400);
  }
  if (!isStaff) {
    const now = /* @__PURE__ */ new Date();
    const deadlineHours = appointment.shop.cancelDeadlineHours;
    const hoursDifference = (appointment.startTime.getTime() - now.getTime()) / (1e3 * 60 * 60);
    if (hoursDifference < deadlineHours) {
      throw new AppError(
        `Appointments cannot be cancelled within ${deadlineHours} hours of scheduled start time. Please contact the barbershop directly.`,
        400
      );
    }
  }
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: /* @__PURE__ */ new Date(),
      cancellationReason: reason || "Cancelled by customer"
    },
    include: {
      shop: true,
      barber: true,
      service: true,
      customer: true
    }
  });
  await prisma.appointmentStatusHistory.create({
    data: {
      appointmentId,
      previousStatus: appointment.status,
      newStatus: AppointmentStatus.CANCELLED,
      changedById: userId,
      reason: reason || "Cancellation confirmed"
    }
  });
  return updated;
}

// src/server/routes/appointments.ts
var router6 = Router6();
router6.post("/", authenticate, validateBody(CreateBookingSchema), async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const appointment = await createBooking(customerId, req.body);
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});
router6.get("/my", authenticate, async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const { statusGroup } = req.query;
    const now = /* @__PURE__ */ new Date();
    let whereClause = { customerId };
    if (statusGroup === "upcoming") {
      whereClause.status = { in: ["CONFIRMED", "PENDING", "CHECKED_IN", "IN_PROGRESS"] };
      whereClause.startTime = { gte: now };
    } else if (statusGroup === "past") {
      whereClause.OR = [
        { status: "COMPLETED" },
        { status: { in: ["CONFIRMED", "NO_SHOW"] }, startTime: { lt: now } }
      ];
    } else if (statusGroup === "cancelled") {
      whereClause.status = "CANCELLED";
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
            currency: true
          }
        },
        barber: {
          select: { id: true, name: true, avatarUrl: true, specialty: true }
        }
      },
      orderBy: { startTime: statusGroup === "upcoming" ? "asc" : "desc" }
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
      createdAt: a.createdAt.toISOString()
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});
router6.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        shop: true,
        barber: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: {
            changedBy: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }
    const isCustomer = appointment.customerId === userId;
    let isStaff = false;
    if (!isCustomer) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } }
      });
      isStaff = !!membership;
    }
    if (!isCustomer && !isStaff && req.user.role !== "OWNER") {
      throw new AppError("Access denied", 403);
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
      shopAddress: appointment.shop.address
    });
  } catch (err) {
    next(err);
  }
});
router6.post("/:id/cancel", authenticate, validateBody(CancelBookingSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { reason } = req.body;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }
    let isStaff = false;
    if (appointment.customerId !== userId) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } }
      });
      isStaff = !!membership;
    }
    const cancelled = await cancelBooking(id, userId, isStaff, reason);
    res.json(cancelled);
  } catch (err) {
    next(err);
  }
});
router6.post("/:id/reschedule", authenticate, validateBody(RescheduleBookingSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }
    let isStaff = false;
    if (appointment.customerId !== userId) {
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } }
      });
      isStaff = !!membership;
    }
    const rescheduled = await rescheduleBooking(id, userId, isStaff, req.body);
    res.json(rescheduled);
  } catch (err) {
    next(err);
  }
});
router6.get(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER", "BARBER"]),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const { date, startDate, endDate, barberId, status, search } = req.query;
      const whereClause = { shopId };
      if (date && typeof date === "string") {
        const dayStart = /* @__PURE__ */ new Date(`${date}T00:00:00.000Z`);
        const dayEnd = /* @__PURE__ */ new Date(`${date}T23:59:59.999Z`);
        whereClause.startTime = { gte: dayStart, lte: dayEnd };
      } else if (startDate && endDate) {
        whereClause.startTime = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
      if (barberId && typeof barberId === "string") {
        whereClause.barberId = barberId;
      }
      if (status && typeof status === "string") {
        whereClause.status = status;
      }
      if (search && typeof search === "string") {
        whereClause.OR = [
          { bookingReference: { contains: search, mode: "insensitive" } },
          { customer: { firstName: { contains: search, mode: "insensitive" } } },
          { customer: { lastName: { contains: search, mode: "insensitive" } } },
          { customer: { phone: { contains: search, mode: "insensitive" } } }
        ];
      }
      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          barber: { select: { id: true, name: true, avatarUrl: true } },
          service: { select: { id: true, name: true, category: true } }
        },
        orderBy: { startTime: "asc" }
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
        createdAt: a.createdAt.toISOString()
      }));
      res.json(formatted);
    } catch (err) {
      next(err);
    }
  }
);
router6.patch(
  "/shop/:shopId/:id/status",
  authenticate,
  requireShopMember(["OWNER", "MANAGER", "BARBER"]),
  validateBody(UpdateStatusSchema),
  async (req, res, next) => {
    try {
      const { shopId, id } = req.params;
      const { status: newStatus, notes } = req.body;
      const userId = req.user.userId;
      const appointment = await prisma.appointment.findFirst({
        where: { id, shopId }
      });
      if (!appointment) {
        throw new AppError("Appointment not found for this shop", 404);
      }
      const currentStatus = appointment.status;
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(newStatus)) {
        throw new AppError(
          `Invalid state transition: Cannot transition appointment from '${currentStatus}' to '${newStatus}'.`,
          400
        );
      }
      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id },
          data: {
            status: newStatus,
            cancelledAt: newStatus === "CANCELLED" ? /* @__PURE__ */ new Date() : appointment.cancelledAt,
            cancellationReason: newStatus === "CANCELLED" ? notes || "Cancelled by staff" : appointment.cancellationReason
          },
          include: {
            customer: true,
            barber: true
          }
        });
        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: id,
            previousStatus: currentStatus,
            newStatus,
            changedById: userId,
            reason: notes || `Status changed from ${currentStatus} to ${newStatus}`
          }
        });
        return appt;
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);
router6.patch(
  "/:id/status",
  authenticate,
  validateBody(UpdateStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status: newStatus, notes } = req.body;
      const userId = req.user.userId;
      const appointment = await prisma.appointment.findUnique({
        where: { id }
      });
      if (!appointment) {
        throw new AppError("Appointment not found", 404);
      }
      const membership = await prisma.shopMember.findUnique({
        where: { shopId_userId: { shopId: appointment.shopId, userId } }
      });
      if (!membership && req.user.role !== "OWNER") {
        throw new AppError("Access denied: not authorized for this shop", 403);
      }
      const currentStatus = appointment.status;
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(newStatus)) {
        throw new AppError(
          `Invalid state transition: Cannot transition appointment from '${currentStatus}' to '${newStatus}'.`,
          400
        );
      }
      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id },
          data: {
            status: newStatus,
            cancelledAt: newStatus === "CANCELLED" ? /* @__PURE__ */ new Date() : appointment.cancelledAt,
            cancellationReason: newStatus === "CANCELLED" ? notes || "Cancelled by staff" : appointment.cancellationReason
          },
          include: {
            customer: true,
            barber: true
          }
        });
        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: id,
            previousStatus: currentStatus,
            newStatus,
            changedById: userId,
            reason: notes || `Status changed from ${currentStatus} to ${newStatus}`
          }
        });
        return appt;
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);
var appointments_default = router6;

// src/server/routes/dashboard.ts
import { Router as Router7 } from "express";
import { toZonedTime as toZonedTime3 } from "date-fns-tz";
var router7 = Router7();
router7.get(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER", "BARBER"]),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        throw new AppError("Shop not found", 404);
      }
      const now = /* @__PURE__ */ new Date();
      const zonedNow = toZonedTime3(now, shop.timezone);
      const todayStart = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate(), 0, 0, 0);
      const todayEnd = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate(), 23, 59, 59, 999);
      const [
        todayAppointments,
        upcomingCount,
        completedAppointments,
        cancelledCount,
        activeBarbersCount,
        recentAppointments
      ] = await Promise.all([
        // Today's appointments
        prisma.appointment.findMany({
          where: {
            shopId,
            startTime: { gte: todayStart, lte: todayEnd }
          },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
            barber: { select: { name: true } }
          },
          orderBy: { startTime: "asc" }
        }),
        // Upcoming future appointments
        prisma.appointment.count({
          where: {
            shopId,
            startTime: { gte: now },
            status: { in: ["CONFIRMED", "PENDING", "CHECKED_IN"] }
          }
        }),
        // Completed appointments for revenue
        prisma.appointment.findMany({
          where: {
            shopId,
            status: "COMPLETED"
          },
          select: { servicePrice: true }
        }),
        // Cancelled count
        prisma.appointment.count({
          where: { shopId, status: "CANCELLED" }
        }),
        // Active barbers count
        prisma.barberProfile.count({
          where: { shopId, isActive: true }
        }),
        // 10 most recent appointments
        prisma.appointment.findMany({
          where: { shopId },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
            barber: { select: { name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        })
      ]);
      const completedRevenue = completedAppointments.reduce(
        (sum, a) => sum + (a.servicePrice || 0),
        0
      );
      const pendingAppointments = await prisma.appointment.findMany({
        where: {
          shopId,
          status: { in: ["CONFIRMED", "PENDING", "CHECKED_IN", "IN_PROGRESS"] },
          startTime: { gte: now }
        },
        select: { servicePrice: true }
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
          endTime: a.endTime.toISOString()
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
          createdAt: a.createdAt.toISOString()
        }))
      });
    } catch (err) {
      next(err);
    }
  }
);
var dashboard_default = router7;

// src/server/routes/customers.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.get(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER", "BARBER"]),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const { search } = req.query;
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
              createdAt: true
            }
          }
        },
        orderBy: { startTime: "desc" }
      });
      const customerMap = /* @__PURE__ */ new Map();
      for (const a of appointments) {
        if (!customerMap.has(a.customerId)) {
          customerMap.set(a.customerId, {
            ...a.customer,
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalSpent: 0,
            lastBookingDate: a.startTime.toISOString()
          });
        }
        const record = customerMap.get(a.customerId);
        record.totalBookings += 1;
        if (a.status === "COMPLETED") {
          record.completedBookings += 1;
          record.totalSpent += a.servicePrice;
        } else if (a.status === "CANCELLED") {
          record.cancelledBookings += 1;
        }
      }
      let customers = Array.from(customerMap.values());
      if (search && typeof search === "string") {
        const query = search.toLowerCase();
        customers = customers.filter(
          (c) => c.firstName.toLowerCase().includes(query) || c.lastName.toLowerCase().includes(query) || c.email.toLowerCase().includes(query) || c.phone && c.phone.includes(query)
        );
      }
      res.json(customers);
    } catch (err) {
      next(err);
    }
  }
);
var customers_default = router8;

// src/server/routes/shopSettings.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.get(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: { workingHours: { orderBy: { dayOfWeek: "asc" } } }
      });
      if (!shop) {
        throw new AppError("Shop not found", 404);
      }
      res.json(shop);
    } catch (err) {
      next(err);
    }
  }
);
router9.put(
  "/shop/:shopId",
  authenticate,
  requireShopMember(["OWNER"]),
  validateBody(ShopSettingsSchema),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const updated = await prisma.shop.update({
        where: { id: shopId },
        data: req.body
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);
router9.put(
  "/shop/:shopId/hours",
  authenticate,
  requireShopMember(["OWNER", "MANAGER"]),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const { workingHours } = req.body;
      if (!Array.isArray(workingHours)) {
        throw new AppError("workingHours must be an array", 400);
      }
      await prisma.$transaction(async (tx) => {
        for (const item of workingHours) {
          await tx.shopWorkingHour.upsert({
            where: {
              shopId_dayOfWeek: {
                shopId,
                dayOfWeek: item.dayOfWeek
              }
            },
            update: {
              openTime: item.openTime,
              closeTime: item.closeTime,
              isClosed: item.isClosed
            },
            create: {
              shopId,
              dayOfWeek: item.dayOfWeek,
              openTime: item.openTime,
              closeTime: item.closeTime,
              isClosed: item.isClosed
            }
          });
        }
      });
      res.json({ message: "Working hours updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);
var shopSettings_default = router9;

// src/server/app.ts
var app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "Chairly API",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use(["/api/auth", "/auth"], auth_default);
app.use(["/api/shops", "/shops"], shops_default);
app.use(["/api/services", "/services"], services_default);
app.use(["/api/barbers", "/barbers"], barbers_default);
app.use(["/api/availability", "/availability"], availability_default);
app.use(["/api/appointments", "/appointments"], appointments_default);
app.use(["/api/dashboard", "/dashboard"], dashboard_default);
app.use(["/api/customers", "/customers"], customers_default);
app.use(["/api/settings", "/settings"], shopSettings_default);
app.use(errorHandler);
var app_default = app;

// src/server/handler.ts
function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  return app_default(req, res);
}
export {
  handler as default
};
