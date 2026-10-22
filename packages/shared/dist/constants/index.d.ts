export declare const DEFAULT_TIMEZONE = "Asia/Tashkent";
export declare const DEFAULT_CURRENCY = "UZS";
export declare const USER_ROLES: {
    readonly CUSTOMER: "CUSTOMER";
    readonly BARBER: "BARBER";
    readonly MANAGER: "MANAGER";
    readonly OWNER: "OWNER";
};
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export declare const SHOP_MEMBER_ROLES: {
    readonly BARBER: "BARBER";
    readonly MANAGER: "MANAGER";
    readonly OWNER: "OWNER";
};
export type ShopMemberRole = (typeof SHOP_MEMBER_ROLES)[keyof typeof SHOP_MEMBER_ROLES];
export declare const APPOINTMENT_STATUSES: {
    readonly PENDING: "PENDING";
    readonly CONFIRMED: "CONFIRMED";
    readonly CHECKED_IN: "CHECKED_IN";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
    readonly NO_SHOW: "NO_SHOW";
};
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[keyof typeof APPOINTMENT_STATUSES];
/**
 * Valid state transitions for appointments.
 * A transition not defined here is invalid and will be rejected.
 */
export declare const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]>;
/**
 * Active statuses that occupy a barber's schedule slot
 */
export declare const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[];
export declare const DAYS_OF_WEEK: readonly [{
    readonly day: 0;
    readonly name: "Sunday";
    readonly short: "Sun";
}, {
    readonly day: 1;
    readonly name: "Monday";
    readonly short: "Mon";
}, {
    readonly day: 2;
    readonly name: "Tuesday";
    readonly short: "Tue";
}, {
    readonly day: 3;
    readonly name: "Wednesday";
    readonly short: "Wed";
}, {
    readonly day: 4;
    readonly name: "Thursday";
    readonly short: "Thu";
}, {
    readonly day: 5;
    readonly name: "Friday";
    readonly short: "Fri";
}, {
    readonly day: 6;
    readonly name: "Saturday";
    readonly short: "Sat";
}];
export declare const SERVICE_CATEGORIES: readonly ["All", "Haircut", "Beard", "Haircut + Beard", "Styling", "Shave & Care"];
