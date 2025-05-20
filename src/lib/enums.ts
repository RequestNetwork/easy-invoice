/**
 * Enum representing the possible statuses of payment details
 * Mirrors the database enum 'payment_details_status'
 */
export enum PaymentDetailsStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
