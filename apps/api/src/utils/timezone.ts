import { parseISO, addMinutes, format, isBefore, isAfter, isEqual } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Combine a date string (YYYY-MM-DD) and a time string (HH:mm) in a specific timezone
 * and return a JavaScript Date object (UTC).
 */
export function combineDateAndTimeInTimezone(
  dateStr: string, // "2026-10-22"
  timeStr: string, // "09:30"
  timezone: string = 'Asia/Tashkent'
): Date {
  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(dateTimeStr, timezone);
}

/**
 * Format a Date object to "HH:mm" in the shop's timezone
 */
export function formatTimeInTimezone(
  date: Date,
  timezone: string = 'Asia/Tashkent'
): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, 'HH:mm');
}

/**
 * Format a Date object to "yyyy-MM-dd" in the shop's timezone
 */
export function formatDateInTimezone(
  date: Date,
  timezone: string = 'Asia/Tashkent'
): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, 'yyyy-MM-dd');
}

/**
 * Check if interval [startA, endA) overlaps with [startB, endB)
 */
export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return isBefore(startA, endB) && isAfter(endA, startB);
}
