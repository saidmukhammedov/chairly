import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticate, requirePlatformOwner } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError } from '../middlewares/errorHandler';
import {
  ShopApplicationSchema,
  RejectApplicationSchema,
  normalizePhone,
  parseFullName,
  isValidPhone,
} from '@chairly/shared';

const router = Router();

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Public: Submit a new barbershop application ("Add your barbershop to Chairly")
 */
router.post('/', validateBody(ShopApplicationSchema), async (req: Request, res: Response, next) => {
  try {
    const {
      shopName,
      applicantName,
      applicantPhone,
      city,
      address,
      shopPhone,
      description,
      logoUrl,
      coverImageUrl,
    } = req.body;

    const normApplicantPhone = normalizePhone(applicantPhone);
    const normShopPhone = normalizePhone(shopPhone);

    if (!isValidPhone(normApplicantPhone) || !isValidPhone(normShopPhone)) {
      throw new AppError("Telefon raqamlari to'g'ri formatda kiritilishi lozim", 400);
    }

    // Check if an application is already pending for this shop name or phone
    const existingPending = await prisma.shopApplication.findFirst({
      where: {
        applicantPhone: normApplicantPhone,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new AppError(
        "Sizning telefon raqamingiz bo'yicha ko'rib chiqilayotgan ariza allaqachon mavjud. Iltimos, natijani kuting.",
        400
      );
    }

    // Create the application record
    const application = await prisma.shopApplication.create({
      data: {
        shopName: shopName.trim(),
        applicantName: applicantName.trim(),
        applicantPhone: normApplicantPhone,
        city: city.trim(),
        address: address.trim(),
        shopPhone: normShopPhone,
        description: description.trim(),
        logoUrl: logoUrl?.trim() || null,
        coverImageUrl: coverImageUrl?.trim() || null,
        status: 'PENDING',
      },
    });

    // Create initial persistent confirmation notification
    await prisma.notification.create({
      data: {
        phone: normApplicantPhone,
        applicationId: application.id,
        title: "Ariza qabul qilindi",
        message: `"${shopName.trim()}" sartaroshxonasini Chairly platformasiga qo'shish bo'yicha arizangiz muvaffaqiyatli qabul qilindi. Moderatorlarimiz tez orada uni ko'rib chiqadilar.`,
        type: 'APPLICATION_SUBMITTED',
      },
    });

    res.status(201).json({
      success: true,
      message: "Arizangiz muvaffaqiyatli yuborildi! Ko'rib chiqilgach, sizga xabar beriladi.",
      application: {
        id: application.id,
        shopName: application.shopName,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Public: Check application status by phone number
 */
router.get('/status', async (req: Request, res: Response, next) => {
  try {
    const { phone } = req.query;
    if (!phone || typeof phone !== 'string') {
      throw new AppError("Telefon raqami talab qilinadi", 400);
    }

    const normPhone = normalizePhone(phone);
    const applications = await prisma.shopApplication.findMany({
      where: { applicantPhone: normPhone },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shopName: true,
        city: true,
        status: true,
        rejectionReason: true,
        approvedShopId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

/**
 * Platform Owner Only: List all applications
 */
router.get('/', authenticate, requirePlatformOwner, async (req: Request, res: Response, next) => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status && status !== 'ALL' && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
      whereClause.status = status;
    }

    const applications = await prisma.shopApplication.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.shopApplication.count({ where: { status: 'PENDING' } }),
      prisma.shopApplication.count({ where: { status: 'APPROVED' } }),
      prisma.shopApplication.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({
      applications,
      counts: {
        total: applications.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Platform Owner Only: Get application by ID
 */
router.get('/:id', authenticate, requirePlatformOwner, async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const application = await prisma.shopApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new AppError("Ariza topilmadi", 404);
    }

    res.json(application);
  } catch (err) {
    next(err);
  }
});

/**
 * Platform Owner Only: Approve application and provision barbershop
 */
router.post('/:id/approve', authenticate, requirePlatformOwner, async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.shopApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new AppError("Ariza topilmadi", 404);
    }

    if (application.status !== 'PENDING') {
      throw new AppError(`Ushbu ariza allaqachon ko'rib chiqilgan (Status: ${application.status})`, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate unique slug
      let baseSlug = generateSlug(application.shopName);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await tx.shop.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 2. Create the Barbershop
      const shop = await tx.shop.create({
        data: {
          name: application.shopName,
          slug: uniqueSlug,
          description: application.description,
          phone: application.shopPhone,
          address: application.address,
          city: application.city,
          logoUrl: application.logoUrl,
          coverImageUrl: application.coverImageUrl,
          currency: 'UZS',
          timezone: 'Asia/Tashkent',
          isActive: true,
          leadTimeMinutes: 30,
          horizonDays: 30,
          cancelDeadlineHours: 2,
        },
      });

      // 3. Initialize default 7-day working hours (09:00 - 21:00)
      for (let day = 0; day <= 6; day++) {
        await tx.shopWorkingHour.create({
          data: {
            shopId: shop.id,
            dayOfWeek: day,
            openTime: '09:00',
            closeTime: '21:00',
            isClosed: false,
          },
        });
      }

      // 4. Find or create user for applicant
      let user = await tx.user.findUnique({
        where: { phone: application.applicantPhone },
      });

      let generatedTempPassword: string | null = null;

      if (!user) {
        // Generate secure temporary password
        generatedTempPassword = `Chairly@${crypto.randomInt(100000, 999999)}`;
        const passwordHash = await bcrypt.hash(generatedTempPassword, 10);
        const { firstName, lastName } = parseFullName(application.applicantName);

        user = await tx.user.create({
          data: {
            phone: application.applicantPhone,
            passwordHash,
            firstName,
            lastName,
            role: 'MANAGER',
          },
        });
      } else if (user.role === 'CUSTOMER') {
        // Upgrade customer to MANAGER
        user = await tx.user.update({
          where: { id: user.id },
          data: { role: 'MANAGER' },
        });
      }

      // 5. Create ShopMembership with role OWNER
      await tx.shopMember.create({
        data: {
          shopId: shop.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // 6. Update application status
      const updatedApp = await tx.shopApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          approvedShopId: shop.id,
        },
      });

      // 7. Create notification for applicant
      const tempPassNote = generatedTempPassword
        ? ` Siz uchun do'kon boshqaruvchi hisobi yaratildi. Telefon: ${user.phone}, Vaqtinchalik parol: ${generatedTempPassword}`
        : ` O'z telefon raqamingiz orqali platformaga kirib, boshqaruv panelidan foydalanishingiz mumkin.`;

      await tx.notification.create({
        data: {
          userId: user.id,
          phone: application.applicantPhone,
          applicationId: application.id,
          title: "Arizangiz ma'qullandi! 🎉",
          message: `Tabriklaymiz! "${application.shopName}" sartaroshxonasi Chairly platformasiga muvaffaqiyatli qo'shildi.${tempPassNote}`,
          type: 'APPLICATION_APPROVED',
        },
      });

      return {
        application: updatedApp,
        shop,
        adminUser: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          temporaryPassword: generatedTempPassword,
        },
      };
    });

    res.json({
      success: true,
      message: "Ariza muvaffaqiyatli ma'qullandi va sartaroshxona yaratildi",
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Platform Owner Only: Reject application
 */
router.post('/:id/reject', authenticate, requirePlatformOwner, validateBody(RejectApplicationSchema), async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await prisma.shopApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new AppError("Ariza topilmadi", 404);
    }

    if (application.status !== 'PENDING') {
      throw new AppError(`Ushbu ariza allaqachon ko'rib chiqilgan (Status: ${application.status})`, 400);
    }

    const updated = await prisma.shopApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason?.trim() || "Talablarga muvofiq kelmadi",
      },
    });

    // Persistent notification for applicant
    await prisma.notification.create({
      data: {
        phone: application.applicantPhone,
        applicationId: application.id,
        title: "Arizangiz rad etildi",
        message: `"${application.shopName}" sartaroshxonasini qo'shish bo'yicha arizangiz rad etildi.${reason ? ` Sabab: ${reason}` : ''}`,
        type: 'APPLICATION_REJECTED',
      },
    });

    res.json({
      success: true,
      message: "Ariza rad etildi",
      application: updated,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
