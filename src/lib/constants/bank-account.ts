import type { CountryOption } from "./countries";

export interface CurrencyOption {
  value: string;
  label: string;
}

/**
 * Currencies for bank account form
 */
export const BANK_ACCOUNT_CURRENCIES: CurrencyOption[] = [
  { value: "usd", label: "USD - US Dollar" },
  { value: "eur", label: "EUR - Euro" },
  { value: "gbp", label: "GBP - British Pound" },
  { value: "jpy", label: "JPY - Japanese Yen" },
  { value: "cad", label: "CAD - Canadian Dollar" },
  { value: "aud", label: "AUD - Australian Dollar" },
];

/**
 * Countries for bank account form
 */
export const BANK_ACCOUNT_COUNTRIES: CountryOption[] = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
];

/**
 * Account types for bank account form
 */
export const ACCOUNT_TYPES: CurrencyOption[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
];

/**
 * Payment rails for bank account form
 */
export const PAYMENT_RAILS: CurrencyOption[] = [
  { value: "local", label: "Local (SEPA/ACH)" },
  { value: "swift", label: "SWIFT" },
  { value: "wire", label: "Wire" },
];

/**
 * Beneficiary types for bank account form
 */
export const BENEFICIARY_TYPES: CurrencyOption[] = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
];

/**
 * Enum representing the possible statuses of payment details
 * Mirrors the database enum 'payment_details_status'
 */
export enum PaymentDetailsStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
