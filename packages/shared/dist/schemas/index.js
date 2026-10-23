import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../constants';
import { isValidPhone } from '../utils/phone';
// Customer Registration (Full Name, Phone, Password)
export const RegisterSchema = z.object({
    fullName: z
        .string()
        .min(2, "Ism va familiyangizni kiriting")
        .max(100, "Ism va familiya juda uzun"),
    phone: z
        .string()
        .min(7, "Telefon raqamini kiriting")
        .refine((val) => isValidPhone(val), {
        message: "Telefon raqami noto'g'ri formatda (masalan: +998 90 123 45 67)",
    }),
    password: z
        .string()
        .min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    // Optional legacy fields for backward compatibility
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional().nullable(),
});
// Universal Login Schema (Phone number or Email + Password)
export const LoginSchema = z.object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(1, "Parolni kiriting"),
}).refine((data) => data.identifier || data.phone || data.email, {
    message: "Telefon raqami kiritilishi shart",
    path: ["phone"],
});
// Barbershop Application ("Add your barbershop to Chairly")
export const ShopApplicationSchema = z.object({
    shopName: z
        .string()
        .min(2, "Sartaroshxona nomini kiriting (kamida 2 ta belgi)")
        .max(100),
    applicantName: z
        .string()
        .min(2, "Ariza beruvchining ism-familiyasini kiriting")
        .max(100),
    applicantPhone: z
        .string()
        .min(7, "Aloqa telefon raqamingizni kiriting")
        .refine((val) => isValidPhone(val), {
        message: "Telefon raqami noto'g'ri formatda",
    }),
    city: z
        .string()
        .min(2, "Shaharni kiriting")
        .max(100),
    address: z
        .string()
        .min(3, "To'liq manzilni kiriting")
        .max(200),
    shopPhone: z
        .string()
        .min(7, "Sartaroshxonaning ishchi raqamini kiriting")
        .refine((val) => isValidPhone(val), {
        message: "Sartaroshxona telefon raqami noto'g'ri formatda",
    }),
    description: z
        .string()
        .min(10, "Sartaroshxona haqida qisqacha ma'lumot kiriting (kamida 10 ta belgi)")
        .max(1000),
    logoUrl: z.string().url().optional().nullable().or(z.literal('')),
    coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
});
export const RejectApplicationSchema = z.object({
    reason: z.string().max(500).optional().nullable(),
});
// Booking Creation
export const CreateBookingSchema = z.object({
    shopId: z.string().uuid('Invalid shop ID'),
    serviceId: z.string().uuid('Invalid service ID'),
    barberId: z.string().uuid('Invalid barber ID').optional().nullable(), // Optional if user selected "Any available barber"
    startTime: z.string().datetime({ message: 'Start time must be a valid ISO 8601 string' }),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});
// Reschedule Booking
export const RescheduleBookingSchema = z.object({
    newStartTime: z.string().datetime({ message: 'New start time must be a valid ISO 8601 string' }),
    barberId: z.string().uuid('Invalid barber ID').optional(),
});
// Cancel Booking
export const CancelBookingSchema = z.object({
    reason: z.string().max(300).optional().nullable(),
});
// Status Update (Admin/Staff)
export const UpdateStatusSchema = z.object({
    status: z.nativeEnum(APPOINTMENT_STATUSES, {
        errorMap: () => ({ message: 'Invalid appointment status' }),
    }),
    notes: z.string().optional().nullable(),
});
// Availability Query
export const GetAvailabilityQuerySchema = z.object({
    shopId: z.string().uuid(),
    serviceId: z.string().uuid(),
    barberId: z.string().uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
});
// Service Create/Update
export const ServiceSchema = z.object({
    name: z.string().min(2, 'Service name must be at least 2 characters').max(100),
    description: z.string().max(500).optional().nullable(),
    category: z.string().min(2).max(50).default('Haircut'),
    price: z.number().int().nonnegative('Price must be a positive integer'),
    durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(360),
    bufferMinutes: z.number().int().min(0).max(60).default(5),
    isActive: z.boolean().default(true),
    barberIds: z.array(z.string().uuid()).optional(),
});
// Barber Create/Update
export const BarberSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    bio: z.string().max(500).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
    specialty: z.string().max(100).optional().nullable(),
    isActive: z.boolean().default(true),
    serviceIds: z.array(z.string().uuid()).optional(),
});
// Shop Settings
export const ShopSettingsSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(1000),
    phone: z.string().min(5).max(30),
    address: z.string().min(5).max(200),
    city: z.string().min(2).max(100),
    logoUrl: z.string().optional().nullable(),
    coverImageUrl: z.string().optional().nullable(),
    timezone: z.string().default('Asia/Tashkent'),
    currency: z.string().default('UZS'),
    leadTimeMinutes: z.number().int().min(0).default(30),
    horizonDays: z.number().int().min(1).max(90).default(30),
    cancelDeadlineHours: z.number().int().min(0).default(2),
    isActive: z.boolean().default(true),
});
