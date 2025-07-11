"use client";

import type { PaymentAPIValues } from "@/lib/schemas/payment";
import { api } from "@/trpc/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { useState } from "react";
import { toast } from "sonner";

type RequiredRecurrence = Required<NonNullable<PaymentAPIValues["recurrence"]>>;

type RecurringPaymentBody = Omit<PaymentAPIValues, "recurrence"> & {
  recurrence: RequiredRecurrence;
  subscriptionId?: string;
};

interface UseCreateRecurringPaymentProps {
  onSuccess: () => void;
  onError: (error: unknown) => void;
}

export function useCreateRecurringPayment({
  onSuccess,
  onError,
}: UseCreateRecurringPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const { mutateAsync: pay } = api.payment.pay.useMutation();
  const { mutateAsync: submitRecurringSignature } =
    api.payment.submitRecurringSignature.useMutation();
  const { mutateAsync: createRecurringPaymentApi } =
    api.recurringPayment.createRecurringPayment.useMutation();

  const createRecurringPayment = async (
    recurringPaymentBody: RecurringPaymentBody,
  ) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    setPaymentStatus("processing");

    try {
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
      const signer = ethersProvider.getSigner();

      toast.info("Creating recurring payment...");

      const paymentData = await pay(recurringPaymentBody);
      const { id, transactions, recurringPaymentPermit } = paymentData;

      await createRecurringPaymentApi({
        payee: recurringPaymentBody.payee,
        amount: recurringPaymentBody.amount,
        invoiceCurrency: recurringPaymentBody.invoiceCurrency,
        paymentCurrency: recurringPaymentBody.paymentCurrency,
        startDate: recurringPaymentBody.recurrence.startDate,
        frequency: recurringPaymentBody.recurrence.frequency,
        totalPayments: recurringPaymentBody.recurrence.totalPayments,
        subscriptionId: recurringPaymentBody.subscriptionId,
        payer: address,
        chain: "sepolia", // @NOTE we just allow sepolia for now, we can move it to a dynamic value later
        externalPaymentId: id,
      });

      if (transactions?.length) {
        toast.info("Approval required", {
          description: "Please approve the transaction in your wallet",
        });

        const approvalTransaction = await signer.sendTransaction(
          transactions[0],
        );
        await approvalTransaction.wait();
        toast.success("Approval completed");
      }

      toast.info("Signing permit", {
        description: "Please sign the recurring payment permit in your wallet",
      });

      const typedData = recurringPaymentPermit;
      const signature = await signer._signTypedData(
        typedData.domain,
        typedData.types,
        typedData.values,
      );

      await submitRecurringSignature({
        recurringPaymentId: id,
        permitSignature: signature,
      });

      toast.success("Subscription created successfully!", {
        description:
          "Your recurring payment is now active and will execute on schedule",
      });

      setPaymentStatus("success");
      onSuccess();
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Subscription failed", {
        description:
          "There was an error processing your subscription. Please try again.",
      });
      setPaymentStatus("error");
      onError(error);
    }
  };

  return {
    createRecurringPayment,
    paymentStatus,
  };
}
