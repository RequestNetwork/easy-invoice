import type { TransactionReceipt } from "viem";
import { RN_API_URL } from "../constants";
import type { FeeInfo, PaymentError } from "../types";

export interface PaymentParams {
  amountInUsd: string;
  payerWallet: string;
  recipientWallet: string;
  paymentCurrency: string;
  reference?: string;
  feeInfo?: FeeInfo;
  customerInfo: {
    // This matches the API spec
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

interface PayoutAPITransaction {
  to: string;
  data: string;
  value: number | string | { type: string; hex: string };
}
export interface PayoutAPIResponse {
  requestId: string;
  paymentReference: string;
  transactions: PayoutAPITransaction[];
  metadata: {
    stepsRequired: number;
    needsApproval: boolean;
    approvalTransactionIndex: number;
    paymentTransactionIndex: number;
  };
}

export type TxParams = {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
};

export type SendTransactionFunction = (tx: TxParams) => Promise<`0x${string}`>;

export type WaitForTransactionFunction = (
  hash: `0x${string}`,
) => Promise<TransactionReceipt>;

export const isPaymentError = (error: unknown): error is PaymentError => {
  return (
    error !== null &&
    typeof error === "object" &&
    "type" in error &&
    "error" in error
  );
};

export const normalizeValue = (
  value: PayoutAPITransaction["value"],
): bigint => {
  // ERC20 tokens don't have a bignumber returned
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error(
        "Unsafe numeric value for tx.value; expected string/hex BigInt.",
      );
    }
    return BigInt(value);
  }

  if (typeof value === "string") {
    return BigInt(value);
  }

  if (typeof value === "object" && value !== null && "hex" in value) {
    return BigInt(value.hex);
  }

  console.warn("Unknown value format, defaulting to 0:", value);
  throw new Error("Unknown value format");
};

export const executeTransactions = async (
  transactions: PayoutAPITransaction[],
  sendTransaction: SendTransactionFunction,
  waitForTransaction: WaitForTransactionFunction,
): Promise<TransactionReceipt[]> => {
  const receipts: TransactionReceipt[] = [];

  try {
    for (const tx of transactions) {
      const hash = await sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: normalizeValue(tx.value),
      });

      const receipt = await waitForTransaction(hash);
      if (receipt.status !== "success") {
        throw new Error(`Transaction reverted: ${hash}`);
      }

      receipts.push(receipt);
    }

    return receipts;
  } catch (error) {
    console.error("Transaction execution failed:", error);
    throw { type: "transaction", error: error as Error } as PaymentError;
  }
};

export const createPayout = async (
  rnApiClientId: string,
  params: PaymentParams,
): Promise<Response> => {
  const {
    amountInUsd,
    payerWallet,
    recipientWallet,
    paymentCurrency,
    feeInfo,
    reference,
  } = params;

  const response = await fetch(`${RN_API_URL}/v2/payouts`, {
    method: "POST",
    headers: {
      "x-client-id": rnApiClientId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInUsd,
      payerWallet: payerWallet,
      payee: recipientWallet,
      invoiceCurrency: "USD",
      paymentCurrency: paymentCurrency,
      feePercentage: feeInfo?.feePercentage || undefined,
      feeAddress: feeInfo?.feeAddress || undefined,
      customerInfo: params.customerInfo,
      reference,
    }),
  });

  return response;
};

export interface PaymentResponse {
  requestId: string;
  transactionReceipts: TransactionReceipt[];
}

export const executePayment = async ({
  paymentParams,
  rnApiClientId,
  sendTransaction,
  waitForTransaction,
}: {
  rnApiClientId: string;
  paymentParams: PaymentParams;
  sendTransaction: SendTransactionFunction;
  waitForTransaction: WaitForTransactionFunction;
}): Promise<PaymentResponse> => {
  try {
    const response = await createPayout(rnApiClientId, paymentParams);

    if (!response.ok) {
      let errorMessage = "Failed to create payment";

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, just use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      const error = new Error(errorMessage);
      throw { type: "api", error } as PaymentError;
    }

    const data: PayoutAPIResponse = await response.json();

    if (Array.isArray(data?.transactions) && data.transactions.length > 0) {
      const transactionReceipts = await executeTransactions(
        data.transactions,
        sendTransaction,
        waitForTransaction,
      );

      return { requestId: data.requestId, transactionReceipts };
    } else {
      const error = new Error("No transaction data received from backend");
      throw { type: "api", error } as PaymentError;
    }
  } catch (error) {
    console.error("Error in payment flow:", error);
    if (isPaymentError(error)) {
      throw error;
    } else {
      throw { type: "unknown", error: error as Error } as PaymentError;
    }
  }
};
