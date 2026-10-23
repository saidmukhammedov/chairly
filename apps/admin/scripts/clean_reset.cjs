const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public' } }
});

async function cleanReset() {
  console.log('--- EXECUTING SAFE CLEAN RESET ---');

  // Verify that admin@chairly.app exists
  const owner = await prisma.user.findUnique({ where: { email: 'admin@chairly.app' } });
  if (!owner) {
    throw new Error('Platform owner account admin@chairly.app not found. Aborting for safety.');
  }

  console.log('1. Deleting demo appointment histories & appointments...');
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.appointment.deleteMany();

  console.log('2. Deleting demo favorites & barber relations...');
  await prisma.favorite.deleteMany();
  await prisma.barberBlockedTime.deleteMany();
  await prisma.barberBreak.deleteMany();
  await prisma.barberSchedule.deleteMany();
  await prisma.barberService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barberProfile.deleteMany();
  await prisma.shopWorkingHour.deleteMany();

  console.log('3. Deleting demo shop memberships...');
  await prisma.shopMember.deleteMany();

  console.log('4. Deleting demo shops...');
  await prisma.shop.deleteMany();

  console.log('5. Deleting demo users (excluding platform owner admin@chairly.app)...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@chairly.app' }
    }
  });
  console.log(`Deleted ${deletedUsers.count} demo users.`);

  console.log('✓ Clean reset complete! Database is now fresh.');
  console.log('Preserved Platform Owner: admin@chairly.app (OWNER)');

  await prisma.$disconnect();
}

if (process.argv.includes('--execute')) {
  cleanReset().catch(e => {
    console.error('Reset error:', e);
    process.exit(1);
  });
} else {
  console.log('DRY RUN: Pass --execute to run clean reset.');
}
