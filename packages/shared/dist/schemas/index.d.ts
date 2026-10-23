import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    fullName: z.ZodString;
    phone: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    phone: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | null | undefined;
}, {
    fullName: string;
    phone: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | null | undefined;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodEffects<z.ZodObject<{
    identifier: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
    identifier?: string | undefined;
}, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
    identifier?: string | undefined;
}>, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
    identifier?: string | undefined;
}, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
    identifier?: string | undefined;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const ShopApplicationSchema: z.ZodObject<{
    shopName: z.ZodString;
    applicantName: z.ZodString;
    applicantPhone: z.ZodEffects<z.ZodString, string, string>;
    city: z.ZodString;
    address: z.ZodString;
    shopPhone: z.ZodEffects<z.ZodString, string, string>;
    description: z.ZodString;
    logoUrl: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    coverImageUrl: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    shopName: string;
    applicantName: string;
    applicantPhone: string;
    city: string;
    address: string;
    shopPhone: string;
    description: string;
    logoUrl?: string | null | undefined;
    coverImageUrl?: string | null | undefined;
}, {
    shopName: string;
    applicantName: string;
    applicantPhone: string;
    city: string;
    address: string;
    shopPhone: string;
    description: string;
    logoUrl?: string | null | undefined;
    coverImageUrl?: string | null | undefined;
}>;
export type ShopApplicationInput = z.infer<typeof ShopApplicationSchema>;
export declare const RejectApplicationSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>;
export declare const CreateBookingSchema: z.ZodObject<{
    shopId: z.ZodString;
    serviceId: z.ZodString;
    barberId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startTime: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    shopId: string;
    serviceId: string;
    startTime: string;
    barberId?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    shopId: string;
    serviceId: string;
    startTime: string;
    barberId?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export declare const RescheduleBookingSchema: z.ZodObject<{
    newStartTime: z.ZodString;
    barberId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    newStartTime: string;
    barberId?: string | undefined;
}, {
    newStartTime: string;
    barberId?: string | undefined;
}>;
export type RescheduleBookingInput = z.infer<typeof RescheduleBookingSchema>;
export declare const CancelBookingSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
export declare const UpdateStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<{
        readonly PENDING: "PENDING";
        readonly CONFIRMED: "CONFIRMED";
        readonly CHECKED_IN: "CHECKED_IN";
        readonly IN_PROGRESS: "IN_PROGRESS";
        readonly COMPLETED: "COMPLETED";
        readonly CANCELLED: "CANCELLED";
        readonly NO_SHOW: "NO_SHOW";
    }>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    notes?: string | null | undefined;
}, {
    status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    notes?: string | null | undefined;
}>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export declare const GetAvailabilityQuerySchema: z.ZodObject<{
    shopId: z.ZodString;
    serviceId: z.ZodString;
    barberId: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
    shopId: string;
    serviceId: string;
    barberId?: string | undefined;
}, {
    date: string;
    shopId: string;
    serviceId: string;
    barberId?: string | undefined;
}>;
export type GetAvailabilityQuery = z.infer<typeof GetAvailabilityQuerySchema>;
export declare const ServiceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodDefault<z.ZodString>;
    price: z.ZodNumber;
    durationMinutes: z.ZodNumber;
    bufferMinutes: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    barberIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    price: number;
    durationMinutes: number;
    bufferMinutes: number;
    isActive: boolean;
    description?: string | null | undefined;
    barberIds?: string[] | undefined;
}, {
    name: string;
    price: number;
    durationMinutes: number;
    description?: string | null | undefined;
    category?: string | undefined;
    bufferMinutes?: number | undefined;
    isActive?: boolean | undefined;
    barberIds?: string[] | undefined;
}>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
export declare const BarberSchema: z.ZodObject<{
    name: z.ZodString;
    bio: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    avatarUrl: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    specialty: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    serviceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    bio?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    specialty?: string | null | undefined;
    serviceIds?: string[] | undefined;
}, {
    name: string;
    isActive?: boolean | undefined;
    bio?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    specialty?: string | null | undefined;
    serviceIds?: string[] | undefined;
}>;
export type BarberInput = z.infer<typeof BarberSchema>;
export declare const ShopSettingsSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    logoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    coverImageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    timezone: z.ZodDefault<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    leadTimeMinutes: z.ZodDefault<z.ZodNumber>;
    horizonDays: z.ZodDefault<z.ZodNumber>;
    cancelDeadlineHours: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    city: string;
    address: string;
    description: string;
    name: string;
    isActive: boolean;
    timezone: string;
    currency: string;
    leadTimeMinutes: number;
    horizonDays: number;
    cancelDeadlineHours: number;
    logoUrl?: string | null | undefined;
    coverImageUrl?: string | null | undefined;
}, {
    phone: string;
    city: string;
    address: string;
    description: string;
    name: string;
    logoUrl?: string | null | undefined;
    coverImageUrl?: string | null | undefined;
    isActive?: boolean | undefined;
    timezone?: string | undefined;
    currency?: string | undefined;
    leadTimeMinutes?: number | undefined;
    horizonDays?: number | undefined;
    cancelDeadlineHours?: number | undefined;
}>;
export type ShopSettingsInput = z.infer<typeof ShopSettingsSchema>;
