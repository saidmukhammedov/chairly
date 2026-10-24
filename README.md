# Chairly — Full-Stack Barbershop Booking Platform

Chairly is a commercial-grade, multi-shop barbershop booking system comprising:
1. **Customer Mobile Application** (`apps/mobile`): React Native + Expo Router app for discovering barbershops, exploring services, choosing barbers, reserving time slots, managing bookings, and favoriting shops.
2. **Staff & Management Web Dashboard** (`apps/admin`): React + Vite + Tailwind CSS dashboard with role-based access for managing appointments, schedules, staff, services, customers, and business analytics.
3. **Backend API** (`apps/api`): Node.js + Express + Prisma ORM + PostgreSQL REST API with strict concurrency control and role-based authorization.
4. **Shared Package** (`packages/shared`): Shared TypeScript contracts, Zod schemas, status state machines, and design tokens.

---

## Brand & Design System

- **Brand Personality**: Premium, clean, confident, modern, welcoming, effortless.
- **Palette**: Warm off-white (`#FBF9F5`), charcoal/near-black (`#1A1A1A`), terracotta accent (`#C25E3E`), forest success (`#2E7D5B`).
- **Default Locale & Timezone**: `Asia/Tashkent` (UTC+5) with Uzbek Som (`UZS`) pricing and lead-time buffering.

---

## Architecture & Monorepo Structure

```text
chairly/
├── apps/
│   ├── api/          # Express REST API + Prisma ORM
│   ├── admin/        # React + Vite + Tailwind CSS staff dashboard
│   └── mobile/       # Expo React Native customer app (Expo Router)
├── packages/
│   └── shared/       # Zod schemas, TypeScript types, constants
├── package.json      # Monorepo workspaces root
└── tsconfig.base.json
```

---

## Concurrency & Double-Booking Protection

Chairly enforces strict concurrency guarantees during booking and rescheduling:
1. **Transaction-Scoped PostgreSQL Advisory Lock**:  
   `SELECT pg_advisory_xact_lock(hashtext('barber_' || $barberId));`  
   Guarantees that parallel booking attempts for the same barber are strictly serialized across all application server instances. The lock is automatically released upon transaction commit or rollback.
2. **Row-Level Pessimistic Lock**:  
   `SELECT id FROM "BarberProfile" WHERE id = $barberId FOR UPDATE;`  
   Locks the barber's profile row for the duration of the transaction.
3. **Temporal Overlap Verification**:  
   Queries existing active bookings (`CONFIRMED`, `PENDING`, `CHECKED_IN`, `IN_PROGRESS`) where:  
   `startTime < requestedBufferEndTime AND bufferEndTime > requestedStartTime`.  
   If an overlap is detected, the transaction aborts with HTTP `409 Conflict`.

---

## Local Development Seed Data

For local development and testing only, seeded accounts use a development password configured in your local `.env`. Never use default passwords in production.

| Role | Details |
| :--- | :--- |
| **Customer** | Default customer for multi-user booking tests |
| **Shop Owner** | Shop owner / administrator |
| **Shop Barber** | Barbers with service assignments |

### Seeded Barbershops
1. **Chop-Chop Tashkent** (`chop-chop-tashkent`) — Mirzo Ulugbek District, Tashkent
2. **The Barber Club Mirabad** (`the-barber-club-mirabad`) — Mirabad District, Tashkent
3. **Old School Barbershop Chilanzar** (`old-school-barbershop-chilanzar`) — Chilanzar, Tashkent

---

## Quickstart & Installation

### 1. Prerequisites
- **Node.js**: v18+ or v20+ (tested on Node v25 / npm v11)
- **PostgreSQL**: PostgreSQL 14+ running on port `5432`

### 2. Install Dependencies
From the monorepo root:
```bash
npm install
```

### 3. Configure Environment Variables
Ensure `apps/api/.env` exists:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/chairly_db?schema=public"
JWT_SECRET="chairly_development_jwt_secret_key_32_chars_min"
DEFAULT_TIMEZONE="Asia/Tashkent"
DEFAULT_CURRENCY="UZS"
CORS_ORIGIN="http://localhost:5173,http://localhost:8081,http://127.0.0.1:5173"
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to PostgreSQL
npm run db:migrate

# Seed shops, services, barbers, schedules, breaks, and appointments
npm run db:seed
```

### 5. Running the Applications

Open separate terminal tabs or run simultaneously:

#### Run API Backend (Port 4000)
```bash
npm run dev:api
```
- Health check: `http://localhost:4000/api/health`

#### Run Admin Web Dashboard (Port 5173)
```bash
npm run dev:admin
```
- Open browser at: `http://localhost:5173`
- Sign in with your development administrator or staff account

#### Run Customer Mobile App (Expo Metro)
```bash
npm run dev:mobile
```
- Press `a` for Android Emulator
- Press `i` for iOS Simulator
- Press `w` for Web preview
- Or scan QR code using Expo Go app on your phone

> **Note for Android Emulator**: The mobile API service automatically targets `http://10.0.2.2:4000/api` on Android emulators so it seamlessly connects to the local Express backend on the host machine.

---

## Running Tests

Run the full integration test suite covering database isolation, multi-shop RBAC, slot calculations, transaction concurrency locks, and appointment status state machines:

```bash
npm test
```

Expected output:
```text
✓ Health check returns 200 OK
✓ Barbershop discovery lists active shops
✓ Availability calculator generates valid time slots
✓ Double-booking prevention via advisory lock & transaction
✓ Cross-shop data isolation strictly enforced (HTTP 403)
✓ Appointment state machine transitions
✓ Historical snapshot preservation on price update

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

---

## Features & Workflows

### Customer Mobile Application
- **Explore & Search**: Real-time search across shops by name, address, and category filter (Haircut, Beard, Styling, Combo).
- **Shop Detail**: Cover photo, description, contact details, 7-day working hours with today highlighted, services list, and barber profiles.
- **Favorites**: Toggle favorite shops with persistence per customer.
- **Booking Wizard**: Step-by-step service selection, barber selection (or "Any Available"), dynamic 10-day date carousel, live time-slot picker, summary review, and instant confirmation.
- **My Bookings**: Filter by Upcoming, Past, and Cancelled appointments.
- **Cancellation & Rescheduling**: Cancel with policy checks or reschedule seamlessly to a new slot.
- **Profile & Settings**: Edit name, phone number, view notification preferences, and sign out.

### Admin Web Application
- **Executive Dashboard**: Real database analytics (today's bookings, completed, revenue in UZS, active staff, schedule feed).
- **Appointments Management**: List and calendar views, status transitions (`CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), manual walk-in booking creation, cancel/reschedule.
- **Services Catalog**: Create, edit, and toggle services with duration, price, category, and assigned barbers.
- **Staff & Schedules**: Manage barber profiles, weekly working schedules, shift hours, and breaks.
- **Customer CRM**: View customer history, completed appointment totals, and direct contact details.
- **Shop Settings**: Configure shop details, lead-time buffers, booking horizon days, and cancellation deadlines.
- **Multi-Shop Switcher**: Instant switching between authorized barbershop locations for franchise owners.
