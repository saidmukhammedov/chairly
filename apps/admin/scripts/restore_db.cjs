const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public' } }
});

async function restore(backupFilePath) {
  if (!backupFilePath) {
    const backupDir = path.resolve(__dirname, '../backups');
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_') && f.endsWith('.json')).sort().reverse();
    if (files.length === 0) throw new Error('No backup files found');
    backupFilePath = path.join(backupDir, files[0]);
  }

  console.log('Restoring from:', backupFilePath);
  const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  const d = backup.data;

  // Clear current data safely in transaction or reverse order
  console.log('Clearing existing data...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AppointmentStatusHistory", "Appointment", "BarberBlockedTime", "BarberBreak", "BarberSchedule", "ShopWorkingHour", "BarberService", "Service", "BarberProfile", "ShopMember", "Favorite", "Shop", "User" CASCADE;`);

  console.log('Inserting Users...');
  for (const u of d.users) await prisma.user.create({ data: u });

  console.log('Inserting Shops...');
  for (const s of d.shops) await prisma.shop.create({ data: s });

  console.log('Inserting ShopMembers...');
  for (const m of d.shopMembers) await prisma.shopMember.create({ data: m });

  console.log('Inserting BarberProfiles...');
  for (const b of d.barberProfiles) await prisma.barberProfile.create({ data: b });

  console.log('Inserting Services...');
  for (const s of d.services) await prisma.service.create({ data: s });

  console.log('Inserting BarberServices...');
  for (const bs of d.barberServices) await prisma.barberService.create({ data: bs });

  console.log('Inserting ShopWorkingHours...');
  for (const wh of d.shopWorkingHours) await prisma.shopWorkingHour.create({ data: wh });

  console.log('Inserting BarberSchedules...');
  for (const bs of d.barberSchedules) await prisma.barberSchedule.create({ data: bs });

  console.log('Inserting BarberBreaks...');
  for (const bb of d.barberBreaks) await prisma.barberBreak.create({ data: bb });

  console.log('Inserting Appointments...');
  for (const a of d.appointments) await prisma.appointment.create({ data: a });

  console.log('Inserting Status History...');
  for (const sh of d.appointmentStatusHistory) await prisma.appointmentStatusHistory.create({ data: sh });

  console.log('✓ Successfully restored backup!');
  await prisma.$disconnect();
}

const fileArg = process.argv[2];
restore(fileArg).catch(e => {
  console.error('Restore failed:', e);
  process.exit(1);
});
