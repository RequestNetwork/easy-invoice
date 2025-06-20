// Network-specific currency lists
export const MAINNET_CURRENCIES = [
  "USDC-base",
  "USDT-base",
  "DAI-base",
  "USDCn-optimism",
  "USDT-optimism",
  "DAI-optimism",
  "USDCn-matic",
  "USDT-matic",
  "DAI-matic",
  "USDC-mainnet",
  "USDT-mainnet",
  "DAI-mainnet",
  "USDC-arbitrum-one",
  "USDT-arbitrum-one",
  "DAI-arbitrum-one",
] as const;

export const TESTNET_CURRENCIES = [
  "ETH-sepolia-sepolia",
  "FAU-sepolia",
  "fUSDC-sepolia",
  "fUSDT-sepolia",
] as const;

export const FIAT_CURRENCIES = ["USD"] as const;

// Feature-specific currency lists
export const INVOICE_CURRENCIES = [
  ...FIAT_CURRENCIES,
  ...TESTNET_CURRENCIES,
  ...MAINNET_CURRENCIES,
] as const;

export const PAYOUT_CURRENCIES = [
  ...FIAT_CURRENCIES,
  ...TESTNET_CURRENCIES,
] as const;

// Type definitions
export type MainnetCurrency = (typeof MAINNET_CURRENCIES)[number];
export type TestnetCurrency = (typeof TESTNET_CURRENCIES)[number];
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];
export type PayoutCurrency = (typeof PAYOUT_CURRENCIES)[number];

// Currency mappings
export const INVOICE_PAYMENT_CURRENCIES: Partial<{
  [K in InvoiceCurrency]: readonly string[];
}> = {
  USD: ["ETH-sepolia-sepolia", "FAU-sepolia"],
  "ETH-sepolia-sepolia": ["ETH-sepolia-sepolia"],
  "FAU-sepolia": ["FAU-sepolia"],
  "fUSDC-sepolia": ["fUSDC-sepolia"],
  "fUSDT-sepolia": ["fUSDT-sepolia"],
  ...Object.fromEntries(
    MAINNET_CURRENCIES.map((currency) => [currency, [currency]]),
  ),
} as const;

export const PAYOUT_PAYMENT_CURRENCIES: Partial<{
  [K in PayoutCurrency]: readonly string[];
}> = {
  USD: ["ETH-sepolia-sepolia", "FAU-sepolia"],
  "ETH-sepolia-sepolia": ["ETH-sepolia-sepolia"],
  "FAU-sepolia": ["FAU-sepolia"],
  "fUSDC-sepolia": ["fUSDC-sepolia"],
  "fUSDT-sepolia": ["fUSDT-sepolia"],
} as const;

export const RECURRING_PAYMENT_CURRENCIES = [
  "FAU-sepolia",
  "fUSDC-sepolia",
  "fUSDT-sepolia",
] as const;

export type RecurringPaymentCurrency =
  (typeof RECURRING_PAYMENT_CURRENCIES)[number];

// Helper functions
export function getPaymentCurrenciesForInvoice(
  currency: InvoiceCurrency,
): string[] {
  return [...(INVOICE_PAYMENT_CURRENCIES[currency] || [])];
}

export function getPaymentCurrenciesForPayout(
  currency: PayoutCurrency,
): string[] {
  return [...(PAYOUT_PAYMENT_CURRENCIES[currency] || [])];
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
    case "USDC-base":
      return "USDC (Base)";
    case "USDT-base":
      return "USDT (Base)";
    case "DAI-base":
      return "DAI (Base)";
    case "USDCn-optimism":
      return "USDC (Optimism)";
    case "USDT-optimism":
      return "USDT (Optimism)";
    case "DAI-optimism":
      return "DAI (Optimism)";
    case "USDCn-matic":
      return "USDC (Polygon)";
    case "USDT-matic":
      return "USDT (Polygon)";
    case "DAI-matic":
      return "DAI (Polygon)";
    case "USDC-mainnet":
      return "USDC (Mainnet)";
    case "USDT-mainnet":
      return "USDT (Mainnet)";
    case "DAI-mainnet":
      return "DAI (Mainnet)";
    case "USDC-arbitrum-one":
      return "USDC (Arbitrum)";
    case "USDT-arbitrum-one":
      return "USDT (Arbitrum)";
    case "DAI-arbitrum-one":
      return "DAI (Arbitrum)";
    default:
      return currency;
  }
}
