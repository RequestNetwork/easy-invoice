import { format } from "date-fns";

/**
 * Formats a date string to do MMM yyyy format
 * @param date Date string to format
 * @returns Formatted date string
 */
export function formatDate(date: string) {
  try {
    const dateObj = new Date(date);
    return format(dateObj, "do MMM yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}
