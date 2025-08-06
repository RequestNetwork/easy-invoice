import type { ethers, providers } from "ethers";

interface BatchPaymentResult {
  success: boolean;
  error?: string;
}

export interface BatchPaymentData {
  ERC20ApprovalTransactions: providers.TransactionRequest[];
  batchPaymentTransaction: providers.TransactionRequest;
}

export const handleBatchPayment = async ({
  signer,
  batchPaymentData,
  onSuccess,
  onError,
  onStatusChange,
}: {
  signer: ethers.Signer;
  batchPaymentData: BatchPaymentData;
  onSuccess?: () => void;
  onError?: () => void;
  onStatusChange?: (
    status: "processing" | "success" | "error" | "idle",
  ) => void;
}): Promise<BatchPaymentResult> => {
  try {
    onStatusChange?.("processing");

    const isApprovalNeeded =
      batchPaymentData.ERC20ApprovalTransactions.length > 0;

    if (isApprovalNeeded) {
      for (const approvalTransaction of batchPaymentData.ERC20ApprovalTransactions) {
        try {
          const tx = await signer.sendTransaction(approvalTransaction);
          await tx.wait();
        } catch (approvalError: any) {
          if (approvalError?.code === 4001) {
            onStatusChange?.("error");
            onError?.();
            return { success: false, error: "approval_rejected" };
          }
          throw approvalError;
        }
      }
    }

    try {
      const tx = await signer.sendTransaction(
        batchPaymentData.batchPaymentTransaction,
      );
      await tx.wait();

      onStatusChange?.("success");
      onSuccess?.();

      return { success: true };
    } catch (txError: any) {
      if (txError?.code === 4001) {
        onStatusChange?.("error");
        onError?.();
        return { success: false, error: "transaction_rejected" };
      }
      throw txError;
    }
  } catch (error: any) {
    console.error("Payment error:", error);

    if (
      error?.code === "INSUFFICIENT_FUNDS" ||
      error?.message?.toLowerCase().includes("insufficient funds") ||
      (error?.code === "SERVER_ERROR" && error?.error?.code === -32000)
    ) {
      onStatusChange?.("error");
      onError?.();
      return { success: false, error: "insufficient_funds" };
    }

    if (
      error?.message?.toLowerCase().includes("network") ||
      error?.code === "NETWORK_ERROR" ||
      (error?.event === "error" && error?.type === "network")
    ) {
      onStatusChange?.("error");
      onError?.();
      return { success: false, error: "network_error" };
    }

    if (error?.reason) {
      onStatusChange?.("error");
      onError?.();
      return { success: false, error: "contract_error" };
    }

    let errorMessage =
      "There was an error processing your batch payment. Please try again.";

    if (error && typeof error === "object") {
      if (
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
      ) {
        errorMessage = error.data.message || errorMessage;
      } else if ("message" in error) {
        errorMessage = error.message || errorMessage;
      } else if ("response" in error && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (
        "error" in error &&
        typeof error.error === "object" &&
        error.error &&
        "message" in error.error
      ) {
        errorMessage = error.error.message;
      }
    }

    onStatusChange?.("error");
    onError?.();
    return { success: false, error: "unknown_error" };
  }
};
