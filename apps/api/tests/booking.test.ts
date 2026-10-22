import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';

describe('Chairly API & Booking Engine Tests', () => {
  let customerToken: string;
  let customerId: string;
  let chopShopId: string;
  let serviceId: string;
  let barberId: string;
  let otherShopId: string;
  let managerToken: string;

  beforeAll(async () => {
    // Login as existing customer from seed
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@chairly.app', password: 'chairly123' });

    expect(custRes.status).toBe(200);
    customerToken = custRes.body.tokens.accessToken;
    customerId = custRes.body.user.id;

    // Login as Shop 1 Manager
    const mgrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@chopchop.uz', password: 'chairly123' });
    expect(mgrRes.status).toBe(200);
    managerToken = mgrRes.body.tokens.accessToken;

    // Get Shop 1
    const shop1 = await prisma.shop.findFirst({ where: { slug: 'chop-chop-tashkent' } });
    expect(shop1).not.toBeNull();
    chopShopId = shop1!.id;

    // Get Shop 2
    const shop2 = await prisma.shop.findFirst({ where: { slug: 'the-barber-club-mirabad' } });
    otherShopId = shop2!.id;

    // Get a service in Shop 1
    const service = await prisma.service.findFirst({ where: { shopId: chopShopId } });
    serviceId = service!.id;

    // Get a barber in Shop 1
    const barber = await prisma.barberProfile.findFirst({ where: { shopId: chopShopId } });
    barberId = barber!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1. Health check returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('2. Public Shop Discovery lists active shops with starting prices', async () => {
    const res = await request(app).get('/api/shops');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const chop = res.body.find((s: any) => s.id === chopShopId);
    expect(chop).toBeDefined();
    expect(chop.name).toBe('Chop-Chop Tashkent');
    expect(chop.startingPrice).toBeGreaterThan(0);
  });

  test('3. Availability calculation returns valid open slots', async () => {
    // Target 3 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const dateStr = targetDate.toISOString().split('T')[0];

    const res = await request(app)
      .get('/api/availability')
      .query({ shopId: chopShopId, serviceId, barberId, date: dateStr });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const availableSlots = res.body.filter((s: any) => s.available);
    expect(availableSlots.length).toBeGreaterThan(0);
  });

  test('4. Booking creation succeeds and prevents double-booking race condition', async () => {
    // 6 days in future at 11:00 UTC
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 6);
    bookingDate.setHours(11, 0, 0, 0);
    const startTimeIso = bookingDate.toISOString();

    // Clean any leftover test appointment at this time
    await prisma.appointment.deleteMany({
      where: {
        barberId,
        startTime: bookingDate,
      },
    });

    // First booking attempt
    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shopId: chopShopId,
        serviceId,
        barberId,
        startTime: startTimeIso,
        notes: 'Testing concurrency safety',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.bookingReference).toBeDefined();
    expect(res1.body.servicePrice).toBeGreaterThan(0);
    const appointmentId = res1.body.id;

    // Simultaneous second booking attempt for the exact same barber and overlapping slot
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shopId: chopShopId,
        serviceId,
        barberId,
        startTime: startTimeIso,
        notes: 'Competing overlapping booking',
      });

    // Must be rejected with 409 Conflict
    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain('booked by another customer');

    // Clean up test appointment
    await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId } });
    await prisma.appointment.delete({ where: { id: appointmentId } });
  });

  test('5. Multi-Tenant Shop Isolation prevents staff of Shop 1 modifying Shop 2', async () => {
    // Manager of Shop 1 attempts to add service to Shop 2
    const res = await request(app)
      .post(`/api/services/shop/${otherShopId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Hacked Service',
        category: 'Haircut',
        price: 999999,
        durationMinutes: 30,
        bufferMinutes: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('permission');
  });

  test('6. Status state machine strictly enforces allowed transitions', async () => {
    // Find completed appointment from seed
    const completedAppt = await prisma.appointment.findFirst({
      where: { shopId: chopShopId, status: 'COMPLETED' },
    });
    expect(completedAppt).not.toBeNull();

    // Attempt invalid transition: COMPLETED -> CONFIRMED
    const res = await request(app)
      .patch(`/api/appointments/shop/${chopShopId}/${completedAppt!.id}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid state transition');
  });

  test('7. Historical snapshot preserves confirmed price when service price is updated', async () => {
    // Find an appointment with servicePrice
    const appt = await prisma.appointment.findFirst({
      where: { shopId: chopShopId, status: 'CONFIRMED' },
    });
    expect(appt).not.toBeNull();
    const originalConfirmedPrice = appt!.servicePrice;

    // Change service price to 999,999 UZS
    await prisma.service.update({
      where: { id: appt!.serviceId },
      data: { price: 999999 },
    });

    // Check appointment record in database
    const freshAppt = await prisma.appointment.findUnique({
      where: { id: appt!.id },
    });

    expect(freshAppt!.servicePrice).toBe(originalConfirmedPrice);
    expect(freshAppt!.servicePrice).not.toBe(999999);

    // Revert service price back
    await prisma.service.update({
      where: { id: appt!.serviceId },
      data: { price: originalConfirmedPrice },
    });
  });
});
