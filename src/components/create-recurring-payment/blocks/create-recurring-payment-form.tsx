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
import { Label } from "@/components/ui/label";
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

import { useCreateRecurringPayment } from "@/lib/hooks/use-create-recurring-payment";
import { useSwitchNetwork } from "@/lib/hooks/use-switch-network";
import { paymentApiSchema } from "@/lib/schemas/payment";
import { RecurrenceFrequency } from "@/server/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { CheckCircle, Loader2, LogOut, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
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

  const { switchToPaymentNetwork } = useSwitchNetwork();

  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider("eip155");

  const { createRecurringPayment, paymentStatus } = useCreateRecurringPayment({
    onSuccess: () => {
      setTimeout(() => {
        router.push("/payouts/recurring");
      }, 3000);
    },
    onError: (error) => {
      console.error("Subscription error:", error);
    },
  });

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

    await switchToPaymentNetwork(data.invoiceCurrency);

    const recurringPaymentCurrency = data.invoiceCurrency;
    const recurringPaymentBody = {
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

    await createRecurringPayment(recurringPaymentBody);
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
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Minimum 2, maximum 256 executions
                  </p>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/*We use this directly since FormField doesn't have this option */}
            <div>
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
                disabled={paymentStatus === "processing"}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
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
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
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
