import { AppointmentStatus, ShopMemberRole, UserRole } from '../constants';

export interface UserPublic {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
  memberships?: ShopMemberSummary[];
}

export interface ShopMemberSummary {
  shopId: string;
  shopName: string;
  role: ShopMemberRole;
}

export interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  timezone: string;
  currency: string;
  startingPrice?: number;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  isFavorited?: boolean;
}

export interface ShopDetail extends ShopSummary {
  leadTimeMinutes: number;
  horizonDays: number;
  cancelDeadlineHours: number;
  workingHours: ShopWorkingHourItem[];
  services: ServiceItem[];
  barbers: BarberSummary[];
}

export interface ShopWorkingHourItem {
  id: string;
  dayOfWeek: number;
  openTime: string; // "09:00"
  closeTime: string; // "21:00"
  isClosed: boolean;
}

export interface ServiceItem {
  id: string;
  shopId: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  durationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
}

export interface BarberSummary {
  id: string;
  shopId: string;
  userId?: string | null;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  specialty?: string | null;
  isActive: boolean;
  services?: ServiceItem[];
}

export interface BarberScheduleItem {
  id: string;
  barberId: string;
  dayOfWeek: number;
  startTime: string; // "09:00"
  endTime: string;   // "19:00"
  isWorking: boolean;
}

export interface BarberBreakItem {
  id: string;
  barberId: string;
  dayOfWeek: number;
  startTime: string; // "13:00"
  endTime: string;   // "14:00"
  title?: string | null;
}

export interface BarberBlockedTimeItem {
  id: string;
  barberId: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}

export interface TimeSlot {
  time: string;           // "10:00"
  isoString: string;      // Full ISO date-time string
  startTime?: string;     // ISO date-time string alias
  available: boolean;
  barberId?: string;      // Optional specific barber or resolved from "any"
  barberName?: string;
  reason?: string;
}

export interface AppointmentItem {
  id: string;
  bookingReference: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  barberId: string;
  barberName: string;
  barberAvatarUrl?: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  bufferMinutes: number;
  currency: string;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  bufferEndTime: string;
  notes?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  todayAppointmentsCount: number;
  upcomingAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  completedRevenue: number;
  expectedRevenue: number;
  activeBarbersCount: number;
  currency: string;
  recentAppointments: AppointmentItem[];
}
