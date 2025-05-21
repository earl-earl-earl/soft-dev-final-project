// src/utils/dateUtils.ts

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
 * 
 * 
 * @param dateInput 
 * @param options
 * @returns 
 */
export const formatDateForDisplay = (
  dateInput?: Date | string,
  options?: Intl.DateTimeFormatOptions 
): string => {
  if (!dateInput) return "N/A";

  let date: Date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput); 
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    console.warn("formatDateForDisplay received an invalid date:", dateInput);
    return "Invalid Date";
  }

  // Default options for displaying date and time in 'Asia/Manila'
  const defaultDisplayOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',    // e.g., "May"
    day: '2-digit',    // e.g., "20"
    hour: '2-digit',   // e.g., "04"
    minute: '2-digit', // e.g., "28"
    // second: '2-digit', // Uncomment if you want seconds
    hour12: true,      // Use AM/PM
    timeZone: 'Asia/Manila', // <<< CRITICAL: Displays the time in this timezone
  };

  const mergedOptions = { ...defaultDisplayOptions, ...options };

  try {
    // toLocaleString will convert the Date object (which is UTC-based)
    // to the specified timeZone and format it.
    return date.toLocaleString('en-US', mergedOptions); 
                                                      
  } catch (e) {
    console.error("Error formatting date with toLocaleString:", e, dateInput, mergedOptions);
    return "Formatting Error";
  }
};

/**
 * Formats a Date object or a date string into "YYYY-MM-DD" format,
 * based on the calendar date as perceived in the system's local timezone where this code runs.
 * Useful for storing in database DATE columns for check_in/check_out.
 * @param dateInput The Date object or a string that can be parsed into a Date.
 * @returns A "YYYY-MM-DD" string or null if the input is invalid.
 */
export const formatDateForDB = (dateInput?: Date | string): string | null => {
  if (!dateInput) return null;

  let date: Date;
  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
            date = new Date(year, month - 1, day); 
        } else {
            date = new Date(dateInput); 
        }
    } else {
        date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    console.warn("formatDateForDB received an invalid date after parsing:", dateInput);
    return null;
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};