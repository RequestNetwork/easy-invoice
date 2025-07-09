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
import { subscribeToMeApiSchema } from "@/lib/schemas/subscribe-to-me";
import { RecurrenceFrequency } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { LogOut, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

const subscriptionFormSchema = subscribeToMeApiSchema.omit({
  payee: true,
  chain: true,
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface CreateSubscriptionLinkProps {
  onClose: () => void;
}

export function CreateSubscriptionLink({
  onClose,
}: CreateSubscriptionLinkProps) {
  const trpcContext = api.useUtils();
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  const { mutateAsync: createSubscriptionLink, isLoading } =
    api.subscribeToMe.create.useMutation({
      onSuccess: () => {
        toast.success("Subscription template created successfully!");
        trpcContext.subscribeToMe.getAll.invalidate();
        onClose();
      },
      onError: (error) => {
        toast.error("Failed to create subscription template", {
          description: error.message,
        });
      },
    });

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      label: "",
      startDate: new Date(),
      frequency: "MONTHLY",
      amount: 0,
      totalPayments: 12,
      paymentCurrency: "FAU-sepolia",
    },
  });

  const onSubmit = async (data: SubscriptionFormValues) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    await createSubscriptionLink({
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
          // Check if the click target is part of the AppKit modal (custom element) and prevent closing this dialog
          if (
            target.closest("w3m-modal") ||
            target.closest('[data-testid*="w3m"]') ||
            target.closest(".w3m-modal") ||
            target.tagName?.toLowerCase().startsWith("w3m-")
          ) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Subscription Template</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
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
                      disabled={isLoading}
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
                        type="number"
                        placeholder="0.00"
                        step="any"
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
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
