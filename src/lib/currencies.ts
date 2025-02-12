export const INVOICE_CURRENCIES = [
  "USD",
  "ETH-sepolia-sepolia",
  "FAU-sepolia",
  "fUSDC-sepolia",
  "fUSDT-sepolia",
] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

export const PAYMENT_CURRENCIES = {
  USD: ["ETH-sepolia-sepolia", "FAU-sepolia"] as const,
  "ETH-sepolia-sepolia": ["ETH-sepolia-sepolia"] as const,
  "FAU-sepolia": ["FAU-sepolia"] as const,
  "fUSDC-sepolia": ["fUSDC-sepolia"] as const,
  "fUSDT-sepolia": ["fUSDT-sepolia"] as const,
} as const;

export type PaymentCurrency =
  (typeof PAYMENT_CURRENCIES)[InvoiceCurrency][number];

export function getPaymentCurrenciesForInvoice(
  invoiceCurrency: InvoiceCurrency,
): PaymentCurrency[] {
  return [...PAYMENT_CURRENCIES[invoiceCurrency]];
}

export function formatCurrencyLabel(currency: string): string {
  switch (currency) {
    case "ETH-sepolia-sepolia":
      return "Sepolia ETH";
    case "FAU-sepolia":
      return "Sepolia Faucet Token (FAU)";
    case "fUSDC-sepolia":
      return "Sepolia USDC";
    case "fUSDT-sepolia":
      return "Sepolia USDT";
    case "USD":
      return "US Dollar";
    default:
      return currency;
  }
}
