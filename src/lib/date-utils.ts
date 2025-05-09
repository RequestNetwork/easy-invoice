import { format } from "date-fns";

/**
 * Formats a date string to do MMM yyyy format
 * @param date Date string to format
 * @returns Formatted date string
 */
export function formatDate(date: string) {
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }
    return format(dateObj, "do MMM yyyy");
  } catch (error) {
    console.error("Error formatting recurring date:", error);
    return "Invalid date";
  }
}

/**
 * Formats a date string for recurring date display (day month year)
 * @param date Date string to format
 * @returns Formatted date string for recurring dates
 */
export function formatRecurringDate(date: string) {
  return formatDate(date);
}
