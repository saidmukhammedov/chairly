/**
 * Normalize phone numbers into consistent E.164-compatible format.
 * Primarily handles Uzbekistan (+998) numbers, while safely accepting international formats.
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('998')) {
      return '+' + cleaned;
    } else if (cleaned.length === 9) {
      return '+998' + cleaned;
    }
    return '+' + cleaned;
  }
  return cleaned;
}

/**
 * Validates phone numbers.
 * Validates either Uzbekistan standard (+998 XX XXX XX XX - exactly 12 digits total)
 * or general E.164 (+10 to +15 digits).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  // Match Uzbekistan format (+998 followed by 9 digits) or generic E.164
  return /^\+998\d{9}$/.test(normalized) || /^\+\d{10,15}$/.test(normalized);
}

/**
 * Format phone number for human-friendly display:
 * +998 90 123 45 67
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const norm = normalizePhone(phone);
  if (/^\+998\d{9}$/.test(norm)) {
    return `${norm.slice(0, 4)} ${norm.slice(4, 6)} ${norm.slice(6, 9)} ${norm.slice(9, 11)} ${norm.slice(11, 13)}`;
  }
  return norm;
}

/**
 * Splits a single Full Name string into firstName and lastName.
 */
export function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return { firstName: 'Mijoz', lastName: '' };
  }
  const parts = trimmed.split(' ');
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}
