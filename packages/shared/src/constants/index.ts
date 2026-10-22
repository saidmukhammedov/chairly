export const DEFAULT_TIMEZONE = 'Asia/Tashkent';
export const DEFAULT_CURRENCY = 'UZS';

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  BARBER: 'BARBER',
  MANAGER: 'MANAGER',
  OWNER: 'OWNER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const SHOP_MEMBER_ROLES = {
  BARBER: 'BARBER',
  MANAGER: 'MANAGER',
  OWNER: 'OWNER',
} as const;

export type ShopMemberRole = (typeof SHOP_MEMBER_ROLES)[keyof typeof SHOP_MEMBER_ROLES];

export const APPOINTMENT_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[keyof typeof APPOINTMENT_STATUSES];

/**
 * Valid state transitions for appointments.
 * A transition not defined here is invalid and will be rejected.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Final state
  CANCELLED: [], // Final state
  NO_SHOW: [],   // Final state
};

/**
 * Active statuses that occupy a barber's schedule slot
 */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
];

export const DAYS_OF_WEEK = [
  { day: 0, name: 'Sunday', short: 'Sun' },
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
] as const;

export const SERVICE_CATEGORIES = [
  'All',
  'Haircut',
  'Beard',
  'Haircut + Beard',
  'Styling',
  'Shave & Care',
] as const;
