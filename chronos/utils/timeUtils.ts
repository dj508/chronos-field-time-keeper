/**
 * Utility functions for Chronos Field Timekeeper
 */

/**
 * Safe UUID generation with fallback for environments without crypto API
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Constants for time calculations
 */
export const WORKDAY_TARGET_MS = 8.5 * 60 * 60 * 1000; // 8:00 - 16:30 is 8.5h
export const OT_ROUNDING_MS = 15 * 60 * 1000; // 15 Minutes

/**
 * Calculate normal and overtime hours from a time entry
 * Normal hours: 8:00 AM - 4:30 PM
 * Overtime is rounded to 15-minute intervals
 */
export interface TimeSplit {
  normalMs: number;
  overtimeMs: number;
}

export const calculateTimeSplit = (start: number, end: number): TimeSplit => {
  const date = new Date(start);
  const normalStart = new Date(date).setHours(8, 0, 0, 0);
  const normalEnd = new Date(date).setHours(16, 30, 0, 0);

  const normalMs = Math.max(0, Math.min(end, normalEnd) - Math.max(start, normalStart));
  const otBeforeRaw = Math.max(0, Math.min(end, normalStart) - start);
  const roundedOtBefore = Math.floor(otBeforeRaw / OT_ROUNDING_MS) * OT_ROUNDING_MS;
  const otAfterRaw = Math.max(0, end - Math.max(start, normalEnd));
  const roundedOtAfter = Math.ceil(otAfterRaw / OT_ROUNDING_MS) * OT_ROUNDING_MS;

  return { normalMs, overtimeMs: roundedOtBefore + roundedOtAfter };
};

/**
 * Format milliseconds to HH:MM time string
 */
export const formatTime = (ms?: number): string => {
  if (!ms) return '--:--';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format milliseconds to human-readable duration
 */
export const formatDuration = (ms: number): string => {
  if (ms < 0) return '0h 0m 0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
};

/**
 * Convert milliseconds to datetime-local input format
 */
export const toDateTimeLocal = (ms: number): string => {
  const date = new Date(ms);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(ms - offset).toISOString().slice(0, 16);
};

/**
 * Convert datetime-local input value to milliseconds
 */
export const fromDateTimeLocal = (val: string): number => {
  return new Date(val).getTime();
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date | number): boolean => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date | number): boolean => {
  return new Date(date).getTime() < Date.now();
};
