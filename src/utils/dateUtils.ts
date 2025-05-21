// src/utils/dateUtils.ts
import { format, parseISO, addHours } from 'date-fns';

export const createMockDate = (
  year: number,
  month: number, // User provides month as 1-12
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): Date => {
  return new Date(year, month - 1, day, hour, minute, second, millisecond);
};

/**
 * Formats a Date object or a date string into a human-readable format,
 * considering timezone differences for accurate display.
 * @param date The Date object or a string that can be parsed into a Date.
 * @param fromDatabase Optional. Indicates if the date is coming from the database.
 *                      If true, 8 hours will be added to the date assuming it's in UTC.
 * @returns A formatted date string or "N/A" if the input is invalid.
 */
export const formatDateForDisplay = (
  date?: Date | string,
  fromDatabase = true // Add parameter to indicate if date is from DB
): string => {
  if (!date) return "N/A";
  
  try {
    // If it's a string, parse it as ISO
    let dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Add 8 hours to dates coming from the database (UTC to UTC+8)
    if (fromDatabase) {
      dateObj = addHours(dateObj, 8);
    }
    
    // Format with the time to show both date and time
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch (e) {
    console.error("Date formatting error:", e);
    return typeof date === 'string' ? date : 'Invalid Date';
  }
}

/**
 * Formats a Date object or a date string into "YYYY-MM-DD" format,
 * based on the calendar date as perceived in the system's local timezone where this code runs.
 * Useful for storing in database DATE columns for check_in/check_out.
 * @param dateInput The Date object or a string that can be parsed into a Date.
 * @returns A "YYYY-MM-DD" string or null if the input is invalid.
 */
export const formatDateForDB = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "";
  // Format as YYYY-MM-DD which is timezone-independent
  return format(date, 'yyyy-MM-dd');
}