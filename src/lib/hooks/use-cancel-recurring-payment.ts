"use client";

import { getCanCancelPayment } from "@/lib/utils";
import type { RecurringPayment } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { toast } from "sonner";

interface UseCancelRecurringPaymentProps {
  onSuccess?: () => Promise<void>;
}

export function useCancelRecurringPayment({
  onSuccess,
}: UseCancelRecurringPaymentProps) {
  const utils = api.useUtils();
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const updateRecurringPaymentMutation =
    api.recurringPayment.updateRecurringPayment.useMutation();

  const updateRecurringPaymentForSubscriptionMutation =
    api.recurringPayment.updateRecurringPaymentForSubscription.useMutation();

  const cancelRecurringPayment = async (
    payment: RecurringPayment,
    subscriptionId?: string,
  ) => {
    if (!getCanCancelPayment(payment.status)) {
      const error = new Error("This payment cannot be cancelled");
      toast.error(error.message);
      throw error;
    }

    if (!isConnected || !walletProvider) {
      const error = new Error("Please connect your wallet first");
      toast.error(error.message);
      throw error;
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
      const signer = ethersProvider.getSigner();

      toast.info("Cancelling recurring payment...");

      const response = subscriptionId
        ? await updateRecurringPaymentForSubscriptionMutation.mutateAsync({
            externalPaymentId: payment.externalPaymentId,
            subscriptionId,
            action: "cancel",
          })
        : await updateRecurringPaymentMutation.mutateAsync({
            externalPaymentId: payment.externalPaymentId,
            action: "cancel",
          });

      const { transactions } = response;

      if (transactions?.length) {
        toast.info("Signature required", {
          description:
            "Please sign the transactions in your wallet to reduce spending cap",
        });

        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];

          try {
            const txResponse = await signer.sendTransaction(transaction);
            await txResponse.wait();
          } catch (txError) {
            // The transactions are just for reducing the spending cap, the payment was already cancelled
            console.error("Transaction error:", txError);
          }
        }
      }

      await utils.recurringPayment.getRecurringPayments.invalidate();
      toast.success("Recurring payment cancelled successfully");
      await onSuccess?.();
    } catch (error) {
      console.error("Cancel recurring payment error:", error);
      toast.error("Failed to cancel recurring payment", {
        description:
          "There was an error cancelling your recurring payment. Please try again.",
      });
      throw error; // Rethrow the error so calling components can handle it
    }
  };

  return {
    cancelRecurringPayment,
    isLoading:
      updateRecurringPaymentMutation.isLoading ||
      updateRecurringPaymentForSubscriptionMutation.isLoading,
  };
}
