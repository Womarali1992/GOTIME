import { format } from 'date-fns';

/**
 * Format a date for API requests (YYYY-MM-DD format)
 */
export const formatDateForAPI = (date: Date): string => format(date, 'yyyy-MM-dd');

/**
 * Format a date for display (human readable)
 */
export const formatDateForDisplay = (date: Date): string => format(date, 'MMMM d, yyyy');

/**
 * Format a date with day of week for display
 */
export const formatDateWithDay = (date: Date): string => format(date, 'EEEE, MMMM d');

/**
 * Format a date for short display (e.g., "Dec 20")
 */
export const formatDateShort = (date: Date): string => format(date, 'MMM d');

/**
 * Format time from 24h to 12h format
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};
