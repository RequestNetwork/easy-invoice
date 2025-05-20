/**
 * Enum representing the possible statuses of payment details
 * Mirrors the database enum 'payment_details_status'
 */
export enum PaymentDetailsStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

/**
 * Enum representing the possible gender options for compliance forms
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}
