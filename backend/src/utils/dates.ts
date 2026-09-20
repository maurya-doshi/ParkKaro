/**
 * Date/time utility functions for ParkKaro.
 * All times are stored and compared in ISO 8601 format.
 */

/**
 * Parse an ISO date string and return a Date object.
 * Throws if the string is not a valid date.
 */
export function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return d;
}

/**
 * Returns the start of the day (00:00:00) for a given date string (YYYY-MM-DD).
 */
export function startOfDay(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return d;
}

/**
 * Combine a date (YYYY-MM-DD) and time (HH:mm) into an ISO string.
 */
export function combineDateAndTime(date: string, time: string): string {
  const iso = `${date}T${time}:00.000Z`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date/time: ${date} ${time}`);
  }
  return d.toISOString();
}

/**
 * Calculate duration in hours between two ISO date strings.
 * Returns a floating point number.
 */
export function durationInHours(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Calculate duration in days between two ISO date strings.
 */
export function durationInDays(startIso: string, endIso: string): number {
  return durationInHours(startIso, endIso) / 24;
}

/**
 * Check if two time ranges overlap.
 * Uses exclusive end-time boundary: [start1, end1) vs [start2, end2)
 * This means abutting ranges (10:00-12:00 and 12:00-14:00) do NOT overlap.
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  // Two half-open intervals [s1,e1) and [s2,e2) overlap iff s1 < e2 AND s2 < e1
  return s1 < e2 && s2 < e1;
}

/**
 * Check if a date is in the past.
 */
export function isInPast(isoStr: string): boolean {
  return new Date(isoStr).getTime() < Date.now();
}

/**
 * Check if a date is in the future.
 */
export function isInFuture(isoStr: string): boolean {
  return new Date(isoStr).getTime() > Date.now();
}

/**
 * Get current ISO timestamp.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Format a date for display (YYYY-MM-DD).
 */
export function formatDate(isoStr: string): string {
  return isoStr.substring(0, 10);
}

/**
 * Get the date portion (YYYY-MM-DD) from an ISO string.
 */
export function getDatePart(isoStr: string): string {
  return isoStr.substring(0, 10);
}
