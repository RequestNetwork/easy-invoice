"use client";

import { useMemo, type ReactNode } from "react";
import { useAccount } from "wagmi";
import type { ReceiptInfo, PaymentError } from "../../types/index";
import type { TransactionReceipt, WalletClient } from "viem";
import type { PaymentWidgetProps } from "../../payment-widget.types";
import { PaymentWidgetContext, type PaymentWidgetContextValue } from "./index";

interface PaymentWidgetProviderProps {
  children: ReactNode;
  amountInUsd: string;
  recipientWallet: string;
  walletAccount?: WalletClient;
  paymentConfig: Omit<
    PaymentWidgetProps["paymentConfig"],
    "walletConnectProjectId"
  >;
  uiConfig?: PaymentWidgetProps["uiConfig"];
  receiptInfo: ReceiptInfo;
  onPaymentSuccess?: (
    requestId: string,
    transactionReceipts: TransactionReceipt[],
  ) => void | Promise<void>;
  onPaymentError?: (error: PaymentError) => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
}

export function PaymentWidgetProvider({
  children,
  amountInUsd,
  recipientWallet,
  walletAccount,
  paymentConfig,
  uiConfig,
  receiptInfo,
  onPaymentSuccess,
  onPaymentError,
  onComplete,
}: PaymentWidgetProviderProps) {
  const { address } = useAccount();

  const isWalletOverride = walletAccount !== undefined;
  const connectedWalletAddress = walletAccount
    ? walletAccount.account?.address
    : address;

  const contextValue: PaymentWidgetContextValue = useMemo(
    () => ({
      amountInUsd,
      recipientWallet,
      walletAccount,
      connectedWalletAddress,
      isWalletOverride,
      paymentConfig: {
        reference: paymentConfig.reference,
        rnApiClientId: paymentConfig.rnApiClientId,
        feeInfo: paymentConfig.feeInfo,
        supportedCurrencies: paymentConfig.supportedCurrencies,
      },
      uiConfig: {
        showReceiptDownload: uiConfig?.showReceiptDownload ?? true,
        showRequestScanUrl: uiConfig?.showRequestScanUrl ?? true,
      },
      receiptInfo,
      onPaymentSuccess,
      onPaymentError,
      onComplete,
    }),
    [
      amountInUsd,
      recipientWallet,
      walletAccount,
      connectedWalletAddress,
      isWalletOverride,
      paymentConfig.rnApiClientId,
      paymentConfig.feeInfo,
      paymentConfig.supportedCurrencies,
      paymentConfig.reference,
      uiConfig?.showReceiptDownload,
      uiConfig?.showRequestScanUrl,
      receiptInfo,
      onPaymentSuccess,
      onPaymentError,
      onComplete,
    ],
  );

  return (
    <PaymentWidgetContext.Provider value={contextValue}>
      {children}
    </PaymentWidgetContext.Provider>
  );
}
