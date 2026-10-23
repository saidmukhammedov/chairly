const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../api/.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public';

// Securely parse connection details without exposing credentials
let hostInfo = 'unknown';
try {
  const parsed = new URL(dbUrl);
  hostInfo = `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
} catch (e) {
  hostInfo = 'PostgreSQL Pooler';
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

async function main() {
  console.log('========================================================');
  console.log('           CHAIRLY DATABASE CLEANUP PROTOCOL            ');
  console.log('========================================================');
  console.log('Target Database Endpoint:', hostInfo);

  // 1. Verify Backup Existence and Validity
  const backupDir = path.resolve(__dirname, '../backups');
  const backupFiles = fs.existsSync(backupDir)
    ? fs.readdirSync(backupDir).filter(f => f.startsWith('backup_') && f.endsWith('.json')).sort().reverse()
    : [];

  if (backupFiles.length === 0) {
    throw new Error('CRITICAL SAFETY CHECK FAILED: No verified backup file found in backups directory. Cleanup aborted.');
  }

  const latestBackupPath = path.join(backupDir, backupFiles[0]);
  const backupContent = JSON.parse(fs.readFileSync(latestBackupPath, 'utf8'));

  if (!backupContent.data || !backupContent.data.users || backupContent.data.users.length === 0) {
    throw new Error('CRITICAL SAFETY CHECK FAILED: Latest backup file is empty or corrupt. Cleanup aborted.');
  }

  console.log(`Verified Backup Snapshot: ${backupFiles[0]} (${(fs.statSync(latestBackupPath).size / 1024).toFixed(1)} KB)`);
  console.log(`Backup Data Contains: ${backupContent.data.users.length} users, ${backupContent.data.shops.length} shops, ${backupContent.data.appointments.length} appointments`);

  // 2. Verify Platform Owner Exists
  const platformOwner = await prisma.user.findUnique({
    where: { email: 'admin@chairly.app' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  });

  if (!platformOwner) {
    throw new Error('CRITICAL SAFETY CHECK FAILED: Platform owner account admin@chairly.app was not found in the target database. Aborting to prevent lockout.');
  }

  console.log(`Verified Platform Owner Account: ${platformOwner.email} (Role: ${platformOwner.role}, ID: ${platformOwner.id})`);

  // 3. Inspect Current State Before Deletion
  const [
    initialUserCount,
    initialShopCount,
    initialApptCount,
    initialServiceCount,
    initialBarberCount,
    initialMemberCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.appointment.count(),
    prisma.service.count(),
    prisma.barberProfile.count(),
    prisma.shopMember.count()
  ]);

  console.log('\nPre-cleanup Record Counts:');
  console.log(` - Users: ${initialUserCount}`);
  console.log(` - Shops: ${initialShopCount}`);
  console.log(` - Appointments: ${initialApptCount}`);
  console.log(` - Services: ${initialServiceCount}`);
  console.log(` - Barber Profiles: ${initialBarberCount}`);
  console.log(` - Shop Memberships: ${initialMemberCount}`);

  const isExecute = process.argv.includes('--execute');

  if (!isExecute) {
    console.log('\n[DRY RUN MODE] Pass --execute flag to perform deletion.');
    await prisma.$disconnect();
    return;
  }

  console.log('\n--- INITIATING DESTRUCTIVE DATA CLEANUP ---');

  // Deletion in reverse foreign-key order
  const deletedAudit = await prisma.appointmentStatusHistory.deleteMany();
  console.log(`[1/12] Deleted AppointmentStatusHistory: ${deletedAudit.count} records`);

  const deletedAppts = await prisma.appointment.deleteMany();
  console.log(`[2/12] Deleted Appointments: ${deletedAppts.count} records`);

  const deletedFavorites = await prisma.favorite.deleteMany();
  console.log(`[3/12] Deleted Favorites: ${deletedFavorites.count} records`);

  const deletedBlocked = await prisma.barberBlockedTime.deleteMany();
  console.log(`[4/12] Deleted BarberBlockedTimes: ${deletedBlocked.count} records`);

  const deletedBreaks = await prisma.barberBreak.deleteMany();
  console.log(`[5/12] Deleted BarberBreaks: ${deletedBreaks.count} records`);

  const deletedSchedules = await prisma.barberSchedule.deleteMany();
  console.log(`[6/12] Deleted BarberSchedules: ${deletedSchedules.count} records`);

  const deletedBarberServices = await prisma.barberService.deleteMany();
  console.log(`[7/12] Deleted BarberServices: ${deletedBarberServices.count} records`);

  const deletedServices = await prisma.service.deleteMany();
  console.log(`[8/12] Deleted Services: ${deletedServices.count} records`);

  const deletedBarberProfiles = await prisma.barberProfile.deleteMany();
  console.log(`[9/12] Deleted BarberProfiles: ${deletedBarberProfiles.count} records`);

  const deletedWorkingHours = await prisma.shopWorkingHour.deleteMany();
  console.log(`[10/12] Deleted ShopWorkingHours: ${deletedWorkingHours.count} records`);

  const deletedShopMembers = await prisma.shopMember.deleteMany();
  console.log(`[11/12] Deleted ShopMemberships: ${deletedShopMembers.count} records`);

  const deletedShops = await prisma.shop.deleteMany();
  console.log(`[12/12] Deleted Shops: ${deletedShops.count} records`);

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@chairly.app' }
    }
  });
  console.log(`[13/13] Deleted Non-Owner Users: ${deletedUsers.count} records`);

  console.log('\n--- VERIFYING POST-CLEANUP DATABASE INTEGRITY ---');

  const [
    finalUsers,
    finalShops,
    finalAppts,
    finalServices,
    finalBarbers,
    finalMembers,
    finalWorkingHours,
    ownerCheck
  ] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, role: true } }),
    prisma.shop.count(),
    prisma.appointment.count(),
    prisma.service.count(),
    prisma.barberProfile.count(),
    prisma.shopMember.count(),
    prisma.shopWorkingHour.count(),
    prisma.user.findUnique({ where: { email: 'admin@chairly.app' } })
  ]);

  console.log(`Post-cleanup Users Count: ${finalUsers.length}`);
  finalUsers.forEach(u => console.log(` - Preserved: ${u.email} (${u.role})`));
  console.log(`Post-cleanup Shops Count: ${finalShops}`);
  console.log(`Post-cleanup Appointments Count: ${finalAppts}`);
  console.log(`Post-cleanup Services Count: ${finalServices}`);
  console.log(`Post-cleanup Barbers Count: ${finalBarbers}`);
  console.log(`Post-cleanup ShopMembers Count: ${finalMembers}`);
  console.log(`Post-cleanup WorkingHours Count: ${finalWorkingHours}`);

  if (finalShops !== 0 || finalAppts !== 0 || finalUsers.length !== 1 || !ownerCheck) {
    throw new Error('DATABASE VERIFICATION FAILED: Residual demo records or missing owner account detected!');
  }

  console.log('\n✓ DATABASE CLEANUP VERIFIED: 100% SUCCESSFUL');
  console.log('✓ Database is fresh and ready for clean onboarding.');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('\nCLEANUP ERROR:', err.message);
  process.exit(1);
});
