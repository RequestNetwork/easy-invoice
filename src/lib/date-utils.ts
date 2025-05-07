import { format } from "date-fns";

/**
 * Formats a date string to dd/MM/yy format
 * @param date Date string to format
 * @returns Formatted date string
 */
export function formatDate(date: string) {
  return format(new Date(date), "dd/MM/yy");
}

/**
 * Formats a date string for recurring date display (day month year)
 * @param date Date string to format
 * @returns Formatted date string for recurring dates
 */
export function formatRecurringDate(date: string) {
  return format(new Date(date), "do MMM yyyy");
}
