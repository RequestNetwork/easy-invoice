"use client";

import { PaymentSecuredUsingRequest } from "@/components/payment-secured-using-request";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYOUT_CURRENCIES,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import type { PaymentAPIValues } from "@/lib/schemas/payment";
import { paymentApiSchema } from "@/lib/schemas/payment";
import {
  RecurrenceFrequency,
  type RecurrenceFrequencyType,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import { CheckCircle, Loader2, LogOut, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

const recurrenceFields = paymentApiSchema.shape.recurrence
  .unwrap()
  .omit({ payer: true }).shape;
const recurringPaymentFormSchema = paymentApiSchema
  .omit({ recurrence: true, paymentCurrency: true }) // we only use invoiceCurrency
  .extend(recurrenceFields);

type RecurringPaymentFormValues = z.infer<typeof recurringPaymentFormSchema>;

export function CreateRecurringPaymentForm() {
  const { mutateAsync: pay } = api.payment.pay.useMutation();
  const { mutateAsync: submitRecurringSignature } =
    api.payment.submitRecurringSignature.useMutation();
  const { mutateAsync: createRecurringPayment } =
    api.recurringPayment.createRecurringPayment.useMutation();

  // Add payment status state
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider("eip155");

  const isProcessing = paymentStatus === "processing";

  const form = useForm<RecurringPaymentFormValues>({
    resolver: zodResolver(recurringPaymentFormSchema),
    defaultValues: {
      payee: "",
      startDate: new Date(),
      frequency: "MONTHLY",
      amount: 0,
      totalExecutions: 12,
      invoiceCurrency: "ETH-sepolia-sepolia",
    },
  });

  const onSubmit = async (data: RecurringPaymentFormValues) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setPaymentStatus("processing");

    try {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );
      const recurringPaymentCurrency = data.invoiceCurrency;

      const signer = ethersProvider.getSigner();

      toast.info("Creating recurring payment...");

      const recurringPaymentBody: PaymentAPIValues = {
        payee: data.payee,
        amount: data.amount,
        invoiceCurrency: recurringPaymentCurrency,
        paymentCurrency: recurringPaymentCurrency,
        recurrence: {
          payer: address,
          totalExecutions: data.totalExecutions,
          startDate: data.startDate,
          frequency: data.frequency,
        },
      };

      const paymentData = await pay(recurringPaymentBody);
      const { id, transactions, recurringPaymentPermit } = paymentData;

      await createRecurringPayment({
        payee: data.payee,
        amount: data.amount,
        invoiceCurrency: recurringPaymentCurrency,
        paymentCurrency: recurringPaymentCurrency,
        startDate: data.startDate,
        frequency: data.frequency,
        totalExecutions: data.totalExecutions,
        payer: address,
        chain: "sepolia", // You can make this dynamic based on the connected network
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

      toast.success("Recurring payment created successfully!", {
        description:
          "Your recurring payment is now active and will execute on schedule",
      });

      setPaymentStatus("success");

      setTimeout(() => {
        form.reset({
          payee: "",
          amount: 0,
          startDate: new Date(),
          frequency: "MONTHLY",
          totalExecutions: 12,
          invoiceCurrency: "ETH-sepolia-sepolia",
        });
        setPaymentStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Recurring payment error:", error);
      toast.error("Payment failed", {
        description:
          "There was an error processing your recurring payment. Please try again.",
      });
      setPaymentStatus("error");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...form.register("startDate", {
              valueAsDate: true,
            })}
            min={new Date().toISOString().split("T")[0]}
            disabled={isProcessing}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.startDate && (
            <p className="text-sm text-red-500">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Recurrence Frequency</Label>
            <Select
              value={form.watch("frequency")}
              onValueChange={(value) =>
                form.setValue("frequency", value as RecurrenceFrequencyType)
              }
              disabled={isProcessing}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {RecurrenceFrequency.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.frequency && (
              <p className="text-sm text-red-500">
                {form.formState.errors.frequency.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalExecutions">Total Number of Executions</Label>
            <Input
              id="totalExecutions"
              type="number"
              placeholder="12"
              min="2"
              max="256"
              {...form.register("totalExecutions", {
                valueAsNumber: true,
              })}
              disabled={isProcessing}
            />
            {form.formState.errors.totalExecutions && (
              <p className="text-sm text-red-500">
                {form.formState.errors.totalExecutions.message}
              </p>
            )}
            <p className="text-xs text-zinc-500">
              Minimum 2, maximum 256 executions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="any"
              min="0"
              {...form.register("amount", {
                valueAsNumber: true,
              })}
              disabled={isProcessing}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceCurrency">Invoice Currency</Label>
            <Select
              value={form.watch("invoiceCurrency")}
              onValueChange={(value) =>
                form.setValue("invoiceCurrency", value as any)
              }
              disabled={isProcessing}
            >
              <SelectTrigger id="invoiceCurrency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {formatCurrencyLabel(currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.invoiceCurrency && (
              <p className="text-sm text-red-500">
                {form.formState.errors.invoiceCurrency.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payee">Recipient Wallet Address</Label>
          <Input
            id="payee"
            placeholder="0x..."
            {...form.register("payee")}
            className="font-mono"
            disabled={isProcessing}
          />
          {form.formState.errors.payee && (
            <p className="text-sm text-red-500">
              {form.formState.errors.payee.message}
            </p>
          )}
        </div>
      </div>

      <PaymentSecuredUsingRequest />

      <CardFooter className="flex justify-between items-center pt-2 pb-6 px-0">
        <button
          type="button"
          onClick={() => open()}
          className="flex items-center text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          disabled={isProcessing}
        >
          <span className="font-mono mr-2">
            {address?.substring(0, 6)}...
            {address?.substring(address?.length - 4)}
          </span>
          <LogOut className="h-3 w-3" />
        </button>
        <Button type="submit" className="relative" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Payment...
            </>
          ) : paymentStatus === "success" ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Payment Created
            </>
          ) : paymentStatus === "error" ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Try Again
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Recurring Payment
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
