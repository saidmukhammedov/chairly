const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public' } }
});

async function inspect() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, createdAt: true } });
  const shops = await prisma.shop.findMany({ select: { id: true, name: true, slug: true, city: true, isActive: true, createdAt: true } });
  const appts = await prisma.appointment.count();
  const services = await prisma.service.count();
  const barbers = await prisma.barberProfile.count();
  const members = await prisma.shopMember.findMany({ include: { shop: { select: { name: true } }, user: { select: { email: true } } } });

  console.log('--- DATABASE INSPECTION ---');
  console.log('Total Users:', users.length);
  users.forEach(u => console.log('  User:', u.email, '| Role:', u.role, '| Name:', u.firstName, u.lastName, '| Created:', u.createdAt));
  console.log('\nTotal Shops:', shops.length);
  shops.forEach(s => console.log('  Shop:', s.name, '| Slug:', s.slug, '| City:', s.city));
  console.log('\nTotal Memberships:', members.length);
  members.forEach(m => console.log('  Member:', m.user?.email, '-> Shop:', m.shop?.name, '| Role:', m.role));
  console.log('\nTotal Appointments:', appts);
  console.log('Total Services:', services);
  console.log('Total Barbers:', barbers);
  await prisma.$disconnect();
}
inspect().catch(e => { console.error(e); process.exit(1); });
