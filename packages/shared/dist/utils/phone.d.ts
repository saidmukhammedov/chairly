/**
 * Normalize phone numbers into consistent E.164-compatible format.
 * Primarily handles Uzbekistan (+998) numbers, while safely accepting international formats.
 */
export declare function normalizePhone(rawPhone: string): string;
/**
 * Validates phone numbers.
 * Validates either Uzbekistan standard (+998 XX XXX XX XX - exactly 12 digits total)
 * or general E.164 (+10 to +15 digits).
 */
export declare function isValidPhone(phone: string): boolean;
/**
 * Format phone number for human-friendly display:
 * +998 90 123 45 67
 */
export declare function formatPhone(phone?: string | null): string;
/**
 * Splits a single Full Name string into firstName and lastName.
 */
export declare function parseFullName(fullName: string): {
    firstName: string;
    lastName: string;
};
