"use client";

import { PaymentSecuredUsingRequest } from "@/components/payment-secured-using-request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { subscriptionPlanApiSchema } from "@/lib/schemas/subscription-plan";
import { RecurrenceFrequency } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { LogOut, Plus, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

const subscriptionPlanFormSchema = subscriptionPlanApiSchema.omit({
  payee: true,
  chain: true,
});

type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanFormSchema>;

interface CreateSubscriptionPlanProps {
  onClose: () => void;
}

export function CreateSubscriptionPlan({
  onClose,
}: CreateSubscriptionPlanProps) {
  const trpcContext = api.useUtils();
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  const { mutateAsync: createSubscriptionPlan, isLoading } =
    api.subscriptionPlan.create.useMutation({
      onSuccess: () => {
        toast.success("Subscription plan created successfully!");
        trpcContext.subscriptionPlan.getAll.invalidate();
        onClose();
      },
      onError: (error: any) => {
        toast.error("Failed to create subscription plan", {
          description: error.message,
        });
      },
    });

  const form = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanFormSchema),
    defaultValues: {
      label: "",
      frequency: "MONTHLY",
      trialDays: 0,
      amount: 0,
      totalPayments: 12,
      paymentCurrency: "FAU-sepolia",
    },
  });

  const onSubmit = async (data: SubscriptionPlanFormValues) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    await createSubscriptionPlan({
      ...data,
      payee: address,
      chain: "sepolia",
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px]"
        onInteractOutside={(e) => {
          const target = e.target as Element;
          // Check if the click target is part of the AppKit modal (custom element)
          if (
            target.closest("w3m-modal") ||
            target.closest('[data-testid*="w3m"]') ||
            target.closest(".w3m-modal") ||
            target.tagName?.toLowerCase().startsWith("w3m-")
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Subscription Plan</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Monthly Update"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={isLoading}
                    >
                      <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalPayments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Number of Payments</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
                        min="2"
                        max="256"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trialDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trial Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
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
                  disabled={isLoading}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <FormField
                control={form.control}
                name="paymentCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Currency</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
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

            <PaymentSecuredUsingRequest />

            <div className="flex justify-between items-center pt-4">
              {!isConnected ? (
                <Button
                  type="button"
                  onClick={() => open()}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => open()}
                    className="flex items-center text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
                    disabled={isLoading}
                  >
                    <span className="font-mono mr-2">
                      {address?.substring(0, 6)}...
                      {address?.substring(address?.length - 4)}
                    </span>
                    <LogOut className="h-3 w-3" />
                  </button>
                  <Button type="submit" disabled={isLoading || !isConnected}>
                    {isLoading ? (
                      "Creating..."
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Plan
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
