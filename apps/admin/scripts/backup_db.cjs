const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public' } }
});

async function backup() {
  console.log('Exporting database backup...');
  const users = await prisma.user.findMany();
  const shops = await prisma.shop.findMany();
  const shopMembers = await prisma.shopMember.findMany();
  const barberProfiles = await prisma.barberProfile.findMany();
  const services = await prisma.service.findMany();
  const barberServices = await prisma.barberService.findMany();
  const shopWorkingHours = await prisma.shopWorkingHour.findMany();
  const barberSchedules = await prisma.barberSchedule.findMany();
  const barberBreaks = await prisma.barberBreak.findMany();
  const barberBlockedTimes = await prisma.barberBlockedTime.findMany();
  const appointments = await prisma.appointment.findMany();
  const appointmentStatusHistory = await prisma.appointmentStatusHistory.findMany();
  const favorites = await prisma.favorite.findMany();

  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      users: users.length,
      shops: shops.length,
      shopMembers: shopMembers.length,
      barberProfiles: barberProfiles.length,
      services: services.length,
      barberServices: barberServices.length,
      shopWorkingHours: shopWorkingHours.length,
      barberSchedules: barberSchedules.length,
      barberBreaks: barberBreaks.length,
      barberBlockedTimes: barberBlockedTimes.length,
      appointments: appointments.length,
      appointmentStatusHistory: appointmentStatusHistory.length,
      favorites: favorites.length,
    },
    data: {
      users,
      shops,
      shopMembers,
      barberProfiles,
      services,
      barberServices,
      shopWorkingHours,
      barberSchedules,
      barberBreaks,
      barberBlockedTimes,
      appointments,
      appointmentStatusHistory,
      favorites,
    }
  };

  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log('✓ Successfully created verified DB backup at:', backupFile);
  console.log('Backup summary:', backupData.counts);
  await prisma.$disconnect();
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
