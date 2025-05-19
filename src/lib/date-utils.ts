import { formatInTimeZone } from "date-fns-tz";

/**
 * Formats a date string to do MMM yyyy format
 * @param date ISO date string to format
 * @param timeZone IANA time zone identifier (defaults to UTC)
 * @returns Formatted date string
 */
export function formatDate(date: string, timeZone = "UTC"): string {
  try {
    const dateObj = new Date(date);
    return formatInTimeZone(dateObj, timeZone, "do MMM yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}
