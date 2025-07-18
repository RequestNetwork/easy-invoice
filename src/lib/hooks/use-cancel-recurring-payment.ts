"use client";

import { getCanCancelPayment } from "@/lib/utils";
import type { RecurringPayment } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { toast } from "sonner";

interface UseCancelRecurringPaymentProps {
  onSuccess?: () => Promise<void>;
  confirmMessage: string;
}

export function useCancelRecurringPayment({
  confirmMessage,
  onSuccess,
}: UseCancelRecurringPaymentProps) {
  const utils = api.useUtils();
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const updateRecurringPaymentMutation =
    api.recurringPayment.updateRecurringPayment.useMutation();

  const setRecurringPaymentStatusMutation =
    api.recurringPayment.setRecurringPaymentStatus.useMutation();

  const cancelRecurringPayment = async (payment: RecurringPayment) => {
    if (!getCanCancelPayment(payment.status)) {
      toast.error("This payment cannot be cancelled");
      return;
    }

    if (!isConnected || !walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
      const signer = ethersProvider.getSigner();

      toast.info("Cancelling recurring payment...");

      const response = await updateRecurringPaymentMutation.mutateAsync({
        externalPaymentId: payment.externalPaymentId,
        action: "cancel",
      });

      const { transactions } = response;

      if (transactions?.length) {
        toast.info("Signature required", {
          description: "Please sign the transactions in your wallet",
        });

        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];

          try {
            const txResponse = await signer.sendTransaction(transaction);
            await txResponse.wait();
          } catch (txError) {
            // the transaction are just for reducing the spending cap, the payment was still cancelled in the backend
            console.error("Transaction error:", txError);
          }
        }
      }

      await setRecurringPaymentStatusMutation.mutateAsync({
        id: payment.id,
        status: "cancelled",
      });

      await utils.recurringPayment.getRecurringPayments.invalidate();
      toast.success("Recurring payment cancelled successfully");
      await onSuccess?.();
    } catch (error) {
      console.error("Cancel recurring payment error:", error);
      toast.error("Failed to cancel recurring payment", {
        description:
          "There was an error cancelling your recurring payment. Please try again.",
      });
    }
  };

  return {
    cancelRecurringPayment,
    isLoading:
      updateRecurringPaymentMutation.isLoading ||
      setRecurringPaymentStatusMutation.isLoading,
  };
}
