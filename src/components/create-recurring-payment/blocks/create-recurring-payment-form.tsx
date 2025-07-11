"use client";

import { PaymentSecuredUsingRequest } from "@/components/payment-secured-using-request";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RECURRING_PAYMENT_CURRENCIES,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import type { PaymentAPIValues } from "@/lib/schemas/payment";
import { paymentApiSchema } from "@/lib/schemas/payment";
import { RecurrenceFrequency } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import { CheckCircle, Loader2, LogOut, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
      totalPayments: 12,
      invoiceCurrency: "FAU-sepolia",
    },
  });

  const onSubmit = async (data: RecurringPaymentFormValues) => {
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
          totalPayments: data.totalPayments,
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
        totalPayments: data.totalPayments,
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

      setTimeout(() => {
        setPaymentStatus("success");
        router.push("/payouts/recurring");
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    id="startDate"
                    type="date"
                    value={
                      field.value
                        ? field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence Frequency</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalPayments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Number of Payments</FormLabel>
                  <FormControl>
                    <Input
                      id="totalPayments"
                      type="number"
                      placeholder="12"
                      min="2"
                      max="256"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value))
                      }
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-zinc-500">
                    Minimum 2, maximum 256 executions
                  </p>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      step="any"
                      min="0"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Currency</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isProcessing}
                    >
                      <SelectTrigger id="invoiceCurrency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRING_PAYMENT_CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {formatCurrencyLabel(currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="payee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Wallet Address</FormLabel>
                <FormControl>
                  <Input
                    id="payee"
                    placeholder="0x..."
                    className="font-mono"
                    disabled={isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
    </Form>
  );
}
