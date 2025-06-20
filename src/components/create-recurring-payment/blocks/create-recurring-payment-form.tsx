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
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { LogOut, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

const recurrenceFields = paymentApiSchema.shape.recurrence.unwrap().shape;
const recurringPaymentFormSchema = paymentApiSchema
  .omit({ recurrence: true })
  .extend(recurrenceFields);

type RecurringPaymentFormValues = z.infer<typeof recurringPaymentFormSchema>;

export function CreateRecurringPaymentForm() {
  const { address } = useAppKitAccount();
  const { open } = useAppKit();

  const form = useForm<RecurringPaymentFormValues>({
    resolver: zodResolver(recurringPaymentFormSchema),
    defaultValues: {
      payee: "",
      startDate: new Date(),
      frequency: "MONTHLY",
      amount: 0,
      totalExecutions: 12,
      invoiceCurrency: "USD",
      paymentCurrency: "ETH-sepolia-sepolia",
    },
  });

  const onSubmit = (data: RecurringPaymentFormValues) => {
    const _recurringPaymentBody: PaymentAPIValues = {
      payee: data.payee,
      amount: data.amount,
      invoiceCurrency: data.invoiceCurrency,
      paymentCurrency: data.paymentCurrency,
      recurrence: {
        payer: address || "",
        totalExecutions: data.totalExecutions,
        startDate: data.startDate,
        frequency: data.frequency,
      },
    };
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
        >
          <span className="font-mono mr-2">
            {address?.substring(0, 6)}...
            {address?.substring(address?.length - 4)}
          </span>
          <LogOut className="h-3 w-3" />
        </button>
        <Button type="submit">
          <Plus className="mr-2 h-4 w-4" />
          Create Recurring Payment
        </Button>
      </CardFooter>
    </form>
  );
}
