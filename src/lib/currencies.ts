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

export type MainnetCurrency = (typeof MAINNET_CURRENCIES)[number];

export const INVOICE_CURRENCIES = [
  "USD",
  "ETH-sepolia-sepolia",
  "FAU-sepolia",
  "fUSDC-sepolia",
  "fUSDT-sepolia",
  ...MAINNET_CURRENCIES,
] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

export const PAYMENT_CURRENCIES: Partial<{
  [K in InvoiceCurrency]: readonly string[];
}> = {
  USD: ["ETH-sepolia-sepolia", "FAU-sepolia"] as const,
  "ETH-sepolia-sepolia": ["ETH-sepolia-sepolia"] as const,
  "FAU-sepolia": ["FAU-sepolia"] as const,
  "fUSDC-sepolia": ["fUSDC-sepolia"] as const,
  "fUSDT-sepolia": ["fUSDT-sepolia"] as const,
  ...Object.fromEntries(
    MAINNET_CURRENCIES.map((currency) => [currency, [currency]]),
  ),
} as const;

export type PaymentCurrency = NonNullable<
  (typeof PAYMENT_CURRENCIES)[InvoiceCurrency]
>[number];

export function getPaymentCurrenciesForInvoice(
  invoiceCurrency: InvoiceCurrency,
): PaymentCurrency[] {
  return [...(PAYMENT_CURRENCIES[invoiceCurrency] || [])];
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
