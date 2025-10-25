import { createContext } from "react";
import type { ReceiptInfo, FeeInfo, PaymentError } from "../../types/index";
import type { TransactionReceipt, WalletClient } from "viem";

export interface PaymentWidgetContextValue {
  amountInUsd: string;
  recipientWallet: string;

  walletAccount?: WalletClient;
  connectedWalletAddress?: string;
  isWalletOverride: boolean;

  paymentConfig: {
    reference?: string;
    rnApiClientId: string;
    feeInfo?: FeeInfo;
    supportedCurrencies: string[];
  };

  uiConfig: {
    showRequestScanUrl: boolean;
    showReceiptDownload: boolean;
  };

  receiptInfo: ReceiptInfo;

  onPaymentSuccess?: (
    requestId: string,
    transactionReceipts: TransactionReceipt[],
  ) => void | Promise<void>;
  onPaymentError?: (error: PaymentError) => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
}

export const PaymentWidgetContext =
  createContext<PaymentWidgetContextValue | null>(null);
