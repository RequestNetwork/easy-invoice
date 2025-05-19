/**
 * Converts a status code to a human-readable display text
 */
import type { requestStatusEnum } from "../server/db/schema";

/**
 * Converts invoice status to human-readable display text
 * @param status - The invoice status from requestStatusEnum
 * @param isOverdue - Optional flag indicating if the invoice is overdue
 * @returns A formatted status string for display
 */
export const getStatusDisplayText = (
  status: (typeof requestStatusEnum.enumValues)[number],
  isOverdue?: boolean,
) => {
  if (isOverdue) return "Overdue";

  switch (status) {
    case "paid":
      return "Paid";
    case "crypto_paid":
      return "Crypto Paid";
    case "offramp_initiated":
      return "Offramp Initiated";
    case "offramp_failed":
      return "Offramp Failed";
    case "offramp_pending":
      return "Offramp Pending";
    case "processing":
      return "Processing";
    case "pending":
      return "Pending";
    // Fallback for any other status
    default:
      return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
};

/**
 * Returns the CSS class for styling the status badge in the invoice table
 * @param status - The invoice status from requestStatusEnum
 * @param isOverdue - Optional flag indicating if the invoice is overdue
 * @returns The appropriate CSS class string for styling the status badge
 */
export const getInvoiceTableStatusClass = (
  status: (typeof requestStatusEnum.enumValues)[number],
  isOverdue?: boolean,
) => {
  if (isOverdue) return "bg-red-50 text-red-700";

  if (status === "paid" || status === "crypto_paid") {
    return "bg-green-50 text-green-700";
  }

  if (status.includes("offramp_failed")) {
    return "bg-red-50 text-red-700";
  }

  if (status.includes("offramp") || status === "processing") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-yellow-50 text-yellow-700";
};

/**
 * Returns the CSS class for styling the status badge in the payment section
 * @param status - The invoice status from requestStatusEnum
 * @returns The appropriate CSS class string for styling the payment section status
 */
export const getPaymentSectionStatusClass = (
  status: (typeof requestStatusEnum.enumValues)[number],
) => {
  if (status === "paid" || status === "crypto_paid") {
    return "bg-green-100 text-green-800";
  }

  if (status === "offramp_failed") {
    return "bg-red-100 text-red-800";
  }

  if (status.includes("offramp") || status === "processing") {
    return "bg-orange-100 text-orange-800";
  }

  return "bg-blue-100 text-blue-800";
};

/**
 * Returns the icon component name for the status in the payment section
 * We return the component name instead of JSX to avoid issues with server/client components
 * @param status - The invoice status from requestStatusEnum
 * @returns The appropriate icon component name based on status
 */
export const getStatusIconName = (
  status: (typeof requestStatusEnum.enumValues)[number],
): "CheckCircle" | "AlertCircle" | "Clock" => {
  if (status === "paid" || status === "crypto_paid") {
    return "CheckCircle";
  }

  if (status === "offramp_failed") {
    return "AlertCircle";
  }

  return "Clock";
};
