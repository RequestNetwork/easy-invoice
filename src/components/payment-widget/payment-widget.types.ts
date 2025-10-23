import type { PropsWithChildren } from "react";
import type { TransactionReceipt, WalletClient } from "viem";
import type { FeeInfo, ReceiptInfo, PaymentError } from "./types";

export interface PaymentConfig {
  walletConnectProjectId?: string;
  rnApiClientId: string;
  reference?: string;
  feeInfo?: FeeInfo;
  supportedCurrencies: string[]; // an array of currency  ids
}

export interface UiConfig {
  showRequestScanUrl?: boolean;
  showReceiptDownload?: boolean;
}

/*
Example on which tailwind css variables we use and that you might want to override in your app
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
*/

export interface PaymentWidgetProps extends PropsWithChildren {
  // The amount to be paid in USD
  amountInUsd: string;
  // The recipient wallet address for the payment
  recipientWallet: string;
  // Override for the buyer's wallet account if you already have an active session
  walletAccount?: WalletClient;
  // Configuration for the payment widget
  paymentConfig: PaymentConfig;
  // UI specific config
  uiConfig?: UiConfig;
  // Receipt information
  receiptInfo: ReceiptInfo;
  // On success callback when the payment is completed
  onPaymentSuccess?: (
    requestId: string,
    receipts: TransactionReceipt[],
  ) => void | Promise<void>;
  // On error callback when the payment fails
  onPaymentError?: (error: PaymentError) => void | Promise<void>;
  // Callback when the widget is closed from the success step
  onComplete?: () => void | Promise<void>;
}
