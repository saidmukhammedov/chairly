import { PrismaClient, UserRole, ShopMemberRole, AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Chairly Database ---');

  // Clean existing data safely in reverse dependency order
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.barberBlockedTime.deleteMany();
  await prisma.barberBreak.deleteMany();
  await prisma.barberSchedule.deleteMany();
  await prisma.barberService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barberProfile.deleteMany();
  await prisma.shopWorkingHour.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('chairly123', 10);

  // 1. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@chairly.app',
      passwordHash,
      firstName: 'Chairly',
      lastName: 'Administrator',
      phone: '+998901110001',
      role: UserRole.OWNER,
    },
  });

  const chopOwner = await prisma.user.create({
    data: {
      email: 'owner@chopchop.uz',
      passwordHash,
      firstName: 'Farrukh',
      lastName: 'Karimov',
      phone: '+998901234567',
      role: UserRole.OWNER,
    },
  });

  const clubOwner = await prisma.user.create({
    data: {
      email: 'owner@barberclub.uz',
      passwordHash,
      firstName: 'Sanjar',
      lastName: 'Usmonov',
      phone: '+998902345678',
      role: UserRole.OWNER,
    },
  });

  const chopManager = await prisma.user.create({
    data: {
      email: 'manager@chopchop.uz',
      passwordHash,
      firstName: 'Malika',
      lastName: 'Akhmedova',
      phone: '+998903456789',
      role: UserRole.MANAGER,
    },
  });

  const rustamUser = await prisma.user.create({
    data: {
      email: 'rustam@chopchop.uz',
      passwordHash,
      firstName: 'Rustam',
      lastName: 'Aliev',
      phone: '+998904567890',
      role: UserRole.BARBER,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const azamatUser = await prisma.user.create({
    data: {
      email: 'azamat@chopchop.uz',
      passwordHash,
      firstName: 'Azamat',
      lastName: 'Nurmatov',
      phone: '+998905678901',
      role: UserRole.BARBER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@chairly.app',
      passwordHash,
      firstName: 'Jasur',
      lastName: 'Tursunov',
      phone: '+998909998877',
      role: UserRole.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'diyor@example.com',
      passwordHash,
      firstName: 'Diyor',
      lastName: 'Murodov',
      phone: '+998935554433',
      role: UserRole.CUSTOMER,
    },
  });

  console.log('✓ Users created');

  // 2. Create Shops
  const shop1 = await prisma.shop.create({
    data: {
      name: 'Chop-Chop Tashkent',
      slug: 'chop-chop-tashkent',
      description: 'First men’s barbershop chain in Tashkent. Classic cuts, beard trims, razor sharp fades, and signature coffee.',
      phone: '+998 71 200 44 55',
      address: 'Amir Temur Avenue, 42',
      city: 'Tashkent',
      coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80',
      timezone: 'Asia/Tashkent',
      currency: 'UZS',
      leadTimeMinutes: 30,
      horizonDays: 30,
      cancelDeadlineHours: 2,
    },
  });

  const shop2 = await prisma.shop.create({
    data: {
      name: 'The Barber Club Mirabad',
      slug: 'the-barber-club-mirabad',
      description: 'An exclusive gentlemen’s grooming club offering hot towel shaves, bespoke beard styling, and premium hair treatments.',
      phone: '+998 71 205 88 99',
      address: 'Mirabad Street, 18',
      city: 'Tashkent',
      coverImageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
      timezone: 'Asia/Tashkent',
      currency: 'UZS',
      leadTimeMinutes: 45,
      horizonDays: 30,
      cancelDeadlineHours: 3,
    },
  });

  const shop3 = await prisma.shop.create({
    data: {
      name: 'Old School Barbershop Chilanzar',
      slug: 'old-school-barbershop-chilanzar',
      description: 'Authentic retro atmosphere, master scissor cuts, traditional straight razor shaves, and top-tier grooming products.',
      phone: '+998 71 277 12 34',
      address: 'Chilanzar 2nd block, Bunyodkor Ave 14',
      city: 'Tashkent',
      coverImageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
      timezone: 'Asia/Tashkent',
      currency: 'UZS',
      leadTimeMinutes: 20,
      horizonDays: 14,
      cancelDeadlineHours: 2,
    },
  });

  console.log('✓ Shops created');

  // 3. Shop Memberships (Roles)
  await prisma.shopMember.createMany({
    data: [
      { shopId: shop1.id, userId: chopOwner.id, role: ShopMemberRole.OWNER },
      { shopId: shop1.id, userId: chopManager.id, role: ShopMemberRole.MANAGER },
      { shopId: shop1.id, userId: rustamUser.id, role: ShopMemberRole.BARBER },
      { shopId: shop1.id, userId: azamatUser.id, role: ShopMemberRole.BARBER },
      { shopId: shop2.id, userId: clubOwner.id, role: ShopMemberRole.OWNER },
    ],
  });

  // 4. Shop Working Hours (09:00 - 21:00, 7 days)
  for (const shop of [shop1, shop2, shop3]) {
    for (let day = 0; day <= 6; day++) {
      await prisma.shopWorkingHour.create({
        data: {
          shopId: shop.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '21:00',
          isClosed: false,
        },
      });
    }
  }

  // 5. Services for Shop 1 (Chop-Chop)
  const chopHaircut = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Classic Haircut',
      category: 'Haircut',
      description: 'Precision scissor and clipper cut, wash, scalp massage, and bespoke styling with matte clay.',
      price: 150000,
      durationMinutes: 45,
      bufferMinutes: 5,
    },
  });

  const chopBeard = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Beard Trim & Contour',
      category: 'Beard',
      description: 'Beard shaping, razor line-up, hot towel finish, and organic beard oil treatment.',
      price: 100000,
      durationMinutes: 30,
      bufferMinutes: 5,
    },
  });

  const chopCombo = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Haircut + Beard Trim',
      category: 'Haircut + Beard',
      description: 'The ultimate combo: full haircut, beard contouring, double hot towel treatment, and styling.',
      price: 220000,
      durationMinutes: 60,
      bufferMinutes: 10,
    },
  });

  const chopFade = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Skin Fade & Line-Up',
      category: 'Haircut',
      description: 'Seamless low, mid, or high skin fade with straight-razor crisp line-up.',
      price: 160000,
      durationMinutes: 45,
      bufferMinutes: 5,
    },
  });

  const chopShave = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Traditional Hot Towel Shave',
      category: 'Shave & Care',
      description: 'Classic straight razor wet shave with pre-shave cream, steaming towels, and soothing balm.',
      price: 130000,
      durationMinutes: 40,
      bufferMinutes: 5,
    },
  });

  // Services for Shop 2
  await prisma.service.createMany({
    data: [
      {
        shopId: shop2.id,
        name: 'Executive Gentlemen Haircut',
        category: 'Haircut',
        description: 'VIP haircut with botanical hair wash and hot towel service.',
        price: 200000,
        durationMinutes: 45,
        bufferMinutes: 10,
      },
      {
        shopId: shop2.id,
        name: 'Royal Shave Experience',
        category: 'Shave & Care',
        description: 'Multi-layer hot towel shave with sandalwood shaving cream and cold compress.',
        price: 170000,
        durationMinutes: 45,
        bufferMinutes: 10,
      },
    ],
  });

  // Services for Shop 3
  await prisma.service.createMany({
    data: [
      {
        shopId: shop3.id,
        name: 'Old School Scissor Cut',
        category: 'Haircut',
        description: 'Pure scissor craftsmanship with vintage pomade styling.',
        price: 110000,
        durationMinutes: 40,
        bufferMinutes: 5,
      },
      {
        shopId: shop3.id,
        name: 'Beard Sculpting',
        category: 'Beard',
        description: 'Straightforward beard shaping and clipper clean-up.',
        price: 70000,
        durationMinutes: 25,
        bufferMinutes: 5,
      },
    ],
  });

  console.log('✓ Services created');

  // 6. Barbers for Shop 1
  const barberRustam = await prisma.barberProfile.create({
    data: {
      shopId: shop1.id,
      userId: rustamUser.id,
      name: 'Rustam Aliev',
      specialty: 'Senior Master & Fade Specialist',
      bio: 'Over 8 years of master barbershop experience. Trained in Istanbul and London, specializing in precision skin fades and modern textured crops.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const barberAzamat = await prisma.barberProfile.create({
    data: {
      shopId: shop1.id,
      userId: azamatUser.id,
      name: 'Azamat Nurmatov',
      specialty: 'Beard Artist & Scissor Master',
      bio: 'Master of classic Italian scissor haircuts and precision beard geometry. Dedicated to craft, perfection, and effortless style.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
  });

  const barberTimur = await prisma.barberProfile.create({
    data: {
      shopId: shop1.id,
      name: 'Timur Valiev',
      specialty: 'Stylist & Hair Treatment',
      bio: 'Specialist in scalp health, modern styling, and traditional hot-towel straight razor shaves.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
  });

  // Barbers for Shop 2
  await prisma.barberProfile.create({
    data: {
      shopId: shop2.id,
      name: 'Khurshid Kasimov',
      specialty: 'Executive Grooming Director',
      bio: '12 years experience delivering bespoke styling for executives and modern gentlemen.',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    },
  });

  // Assign Services to Barbers in Shop 1
  const chopServices = [chopHaircut, chopBeard, chopCombo, chopFade, chopShave];
  for (const s of chopServices) {
    await prisma.barberService.create({
      data: { barberId: barberRustam.id, serviceId: s.id },
    });
    await prisma.barberService.create({
      data: { barberId: barberAzamat.id, serviceId: s.id },
    });
    await prisma.barberService.create({
      data: { barberId: barberTimur.id, serviceId: s.id },
    });
  }

  // 7. Barber Schedules & Breaks
  // Rustam works Mon - Sat, 09:00 - 18:00
  // Azamat works Tue - Sun, 12:00 - 21:00
  // Timur works Wed - Sun, 10:00 - 19:00
  for (const barber of [barberRustam, barberAzamat, barberTimur]) {
    for (let day = 0; day <= 6; day++) {
      const isWorking = (barber === barberRustam && day !== 0) ||
                        (barber === barberAzamat && day !== 1) ||
                        (barber === barberTimur && day >= 3 || day === 0);

      const startTime = barber === barberAzamat ? '12:00' : '09:00';
      const endTime = barber === barberAzamat ? '21:00' : '18:00';

      await prisma.barberSchedule.create({
        data: {
          barberId: barber.id,
          dayOfWeek: day,
          startTime,
          endTime,
          isWorking,
        },
      });

      if (isWorking) {
        await prisma.barberBreak.create({
          data: {
            barberId: barber.id,
            dayOfWeek: day,
            startTime: barber === barberAzamat ? '16:00' : '13:00',
            endTime: barber === barberAzamat ? '17:00' : '14:00',
            title: 'Lunch Break',
          },
        });
      }
    }
  }

  console.log('✓ Barbers and schedules created');

  // 8. Create Favorites
  await prisma.favorite.create({
    data: {
      userId: customer1.id,
      shopId: shop1.id,
    },
  });

  // 9. Appointments (Historical, Today, and Upcoming)
  // Let's create appointments around today's local date
  const now = new Date();
  
  // Completed Appointment Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(11, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday.getTime() + 45 * 60000);
  const yesterdayBuffer = new Date(yesterdayEnd.getTime() + 5 * 60000);

  const apptCompleted = await prisma.appointment.create({
    data: {
      bookingReference: 'CH-1001',
      shopId: shop1.id,
      barberId: barberRustam.id,
      customerId: customer1.id,
      serviceId: chopHaircut.id,
      serviceName: chopHaircut.name,
      servicePrice: chopHaircut.price,
      serviceDuration: chopHaircut.durationMinutes,
      bufferMinutes: chopHaircut.bufferMinutes,
      currency: 'UZS',
      status: AppointmentStatus.COMPLETED,
      startTime: yesterday,
      endTime: yesterdayEnd,
      bufferEndTime: yesterdayBuffer,
      notes: 'Customer requested matte clay finish.',
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      appointmentId: apptCompleted.id,
      previousStatus: AppointmentStatus.CONFIRMED,
      newStatus: AppointmentStatus.COMPLETED,
      changedById: rustamUser.id,
      reason: 'Service completed successfully.',
    },
  });

  // Confirmed Appointment Today (or Tomorrow if late)
  const appt1Start = new Date(now);
  appt1Start.setDate(now.getDate() + 1);
  appt1Start.setHours(10, 0, 0, 0);
  const appt1End = new Date(appt1Start.getTime() + 45 * 60000);
  const appt1Buffer = new Date(appt1End.getTime() + 5 * 60000);

  await prisma.appointment.create({
    data: {
      bookingReference: 'CH-1002',
      shopId: shop1.id,
      barberId: barberRustam.id,
      customerId: customer1.id,
      serviceId: chopHaircut.id,
      serviceName: chopHaircut.name,
      servicePrice: chopHaircut.price,
      serviceDuration: chopHaircut.durationMinutes,
      bufferMinutes: chopHaircut.bufferMinutes,
      currency: 'UZS',
      status: AppointmentStatus.CONFIRMED,
      startTime: appt1Start,
      endTime: appt1End,
      bufferEndTime: appt1Buffer,
      notes: 'First time at Chop-Chop.',
    },
  });

  // Upcoming Appointment for Customer 2
  const appt2Start = new Date(now);
  appt2Start.setDate(now.getDate() + 1);
  appt2Start.setHours(15, 0, 0, 0);
  const appt2End = new Date(appt2Start.getTime() + 60 * 60000);
  const appt2Buffer = new Date(appt2End.getTime() + 10 * 60000);

  await prisma.appointment.create({
    data: {
      bookingReference: 'CH-1003',
      shopId: shop1.id,
      barberId: barberAzamat.id,
      customerId: customer2.id,
      serviceId: chopCombo.id,
      serviceName: chopCombo.name,
      servicePrice: chopCombo.price,
      serviceDuration: chopCombo.durationMinutes,
      bufferMinutes: chopCombo.bufferMinutes,
      currency: 'UZS',
      status: AppointmentStatus.CONFIRMED,
      startTime: appt2Start,
      endTime: appt2End,
      bufferEndTime: appt2Buffer,
    },
  });

  // Cancelled Appointment
  const apptCancelledStart = new Date(now);
  apptCancelledStart.setDate(now.getDate() - 2);
  apptCancelledStart.setHours(14, 0, 0, 0);
  const apptCancelledEnd = new Date(apptCancelledStart.getTime() + 30 * 60000);
  const apptCancelledBuffer = new Date(apptCancelledEnd.getTime() + 5 * 60000);

  await prisma.appointment.create({
    data: {
      bookingReference: 'CH-1004',
      shopId: shop1.id,
      barberId: barberRustam.id,
      customerId: customer2.id,
      serviceId: chopBeard.id,
      serviceName: chopBeard.name,
      servicePrice: chopBeard.price,
      serviceDuration: chopBeard.durationMinutes,
      bufferMinutes: chopBeard.bufferMinutes,
      currency: 'UZS',
      status: AppointmentStatus.CANCELLED,
      startTime: apptCancelledStart,
      endTime: apptCancelledEnd,
      bufferEndTime: apptCancelledBuffer,
      cancelledAt: new Date(),
      cancellationReason: 'Customer had a schedule conflict.',
    },
  });

  console.log('✓ Sample appointments created with historical snapshots');
  console.log('--- Chairly Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
