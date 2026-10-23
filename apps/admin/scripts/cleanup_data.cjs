const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('--- STARTING DATABASE CLEANUP ---');

  // 1. Delete all appointments & status history
  const deletedHistory = await prisma.appointmentStatusHistory.deleteMany({});
  console.log('Deleted appointment status history records:', deletedHistory.count);

  const deletedAppts = await prisma.appointment.deleteMany({});
  console.log('Deleted appointments:', deletedAppts.count);

  // 2. Identify Barberia shop
  const barberia = await prisma.shop.findFirst({
    where: {
      OR: [
        { id: '8cbf648a-8ffd-463d-b024-35c442a8afb0' },
        { name: { contains: 'Barberia', mode: 'insensitive' } },
      ],
    },
  });

  if (!barberia) {
    throw new Error('Barberia shop not found! Aborting deletion.');
  }

  console.log('Preserving Barberia shop:', barberia.id, barberia.name);

  // 3. Delete all other shops
  const deletedShops = await prisma.shop.deleteMany({
    where: {
      id: { not: barberia.id },
    },
  });
  console.log('Deleted other shops:', deletedShops.count);

  // 4. Delete all users except platform owner
  const owner = await prisma.user.findFirst({
    where: { role: 'OWNER' },
  });

  if (!owner) {
    throw new Error('Platform owner not found! Aborting user deletion.');
  }

  console.log('Preserving Platform Owner:', owner.id, owner.email);

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: owner.id },
    },
  });
  console.log('Deleted non-owner users:', deletedUsers.count);

  // 5. Ensure owner is member of Barberia
  const existingMember = await prisma.shopMember.findUnique({
    where: {
      shopId_userId: {
        shopId: barberia.id,
        userId: owner.id,
      },
    },
  });

  if (!existingMember) {
    await prisma.shopMember.create({
      data: {
        shopId: barberia.id,
        userId: owner.id,
        role: 'OWNER',
      },
    });
    console.log('Linked Owner to Barberia shop as OWNER');
  }

  // 6. Delete test notifications & applications if needed
  await prisma.notification.deleteMany({});
  await prisma.shopApplication.deleteMany({});
  console.log('Cleared test notifications & applications');

  // 7. Verify remaining state
  const remainingShops = await prisma.shop.findMany({ select: { id: true, name: true } });
  const remainingUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  const remainingAppts = await prisma.appointment.count();

  console.log('REMAINING SHOPS:', remainingShops);
  console.log('REMAINING USERS:', remainingUsers);
  console.log('REMAINING APPOINTMENTS:', remainingAppts);
  console.log('--- CLEANUP COMPLETE ---');
}

clean()
  .catch((e) => {
    console.error('Cleanup error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
