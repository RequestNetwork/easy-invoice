"use client";

import { PaymentSecuredUsingRequest } from "@/components/payment-secured-using-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type PayoutCurrency,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import { useCreateRecurringPayment } from "@/lib/hooks/use-create-recurring-payment";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { addDays } from "date-fns";
import { BigNumber } from "ethers";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Loader2,
  LogOut,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SubscriptionPlanPreviewProps {
  subscriptionPlan: SubscriptionPlan;
  recipientEmail: string;
}

export function SubscriptionPlanPreview({
  subscriptionPlan,
  recipientEmail,
}: SubscriptionPlanPreviewProps) {
  const router = useRouter();
  const [isAppKitReady, setIsAppKitReady] = useState(false);
  const {
    data: sessionData,
    isLoading: isSessionLoading,
    error: sessionError,
  } = api.auth.getSessionInfo.useQuery();

  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  const { createRecurringPayment, paymentStatus } = useCreateRecurringPayment({
    onSuccess: () => {
      setTimeout(() => {
        router.push("/dashboard/subscriptions");
      }, 3000);
    },
    onError: (error) => {
      console.error("Subscription error:", error);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppKitReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const canSubscribeToPlan =
    !isSessionLoading &&
    !sessionError &&
    sessionData.session?.userId !== subscriptionPlan.userId;

  const amount = BigNumber.from(subscriptionPlan.amount || "0");
  const totalPayments = BigNumber.from(
    subscriptionPlan.totalNumberOfPayments.toString(),
  );
  const totalAmount = amount.mul(totalPayments);
  const displayCurrency = formatCurrencyLabel(subscriptionPlan.paymentCurrency);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleStartSubscription = async () => {
    if (!canSubscribeToPlan) {
      toast.error("You cannot subscribe to your own plan");
      return;
    }

    if (!address || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    const startDate =
      subscriptionPlan.trialDays > 0
        ? addDays(new Date(), subscriptionPlan.trialDays)
        : new Date();

    const recurringPaymentBody = {
      payee: subscriptionPlan.recipient,
      amount: Number(subscriptionPlan.amount),
      invoiceCurrency: subscriptionPlan.paymentCurrency as PayoutCurrency,
      paymentCurrency: subscriptionPlan.paymentCurrency,
      subscriptionId: subscriptionPlan.id,
      recurrence: {
        payer: address,
        totalPayments: subscriptionPlan.totalNumberOfPayments,
        startDate,
        frequency: subscriptionPlan.recurrenceFrequency,
      },
    };

    await createRecurringPayment(recurringPaymentBody);
  };

  const isProcessing = paymentStatus === "processing";

  return (
    <>
      <div className="flex items-center mb-8">
        <Link
          href="/"
          className="text-zinc-600 hover:text-black transition-colors mr-4"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">
          Subscribe to {subscriptionPlan.label}
        </h1>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl">Subscription Details</CardTitle>
            <div className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
              Ready to Subscribe
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Amount Per Payment</p>
                <p className="text-2xl font-bold">
                  {displayCurrency} {amount.toString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Frequency</p>
                  <p className="font-semibold">
                    {subscriptionPlan.recurrenceFrequency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Total Payments</p>
                  <p className="font-semibold">
                    {subscriptionPlan.totalNumberOfPayments}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-600 mb-1">Total Amount</p>
                <p className="font-semibold">
                  {displayCurrency} {totalAmount.toString()}
                </p>
              </div>
              <div>
                {subscriptionPlan.trialDays > 0 ? (
                  <>
                    <p className="text-sm text-zinc-600 mb-1">Trial Period</p>
                    <p className="font-semibold">
                      {`${subscriptionPlan.trialDays} day${
                        subscriptionPlan.trialDays > 1 ? "s" : ""
                      }`}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-600 mb-1">No Trial Period</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <div className="relative">
                  <Input
                    id="recipientEmail"
                    value={recipientEmail}
                    placeholder="creator@example.com"
                    disabled
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(recipientEmail, "Email")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="recipientAddress">Recipient Address</Label>
                <div className="relative">
                  <Input
                    id="recipientAddress"
                    value={subscriptionPlan.recipient}
                    placeholder="0x..."
                    className="font-mono text-sm"
                    disabled
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() =>
                      copyToClipboard(subscriptionPlan.recipient, "Address")
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {isAppKitReady ? (
              isConnected ? (
                <>
                  <PaymentSecuredUsingRequest />

                  <div className="flex justify-between items-center pt-4">
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
                    <Button
                      onClick={handleStartSubscription}
                      disabled={isProcessing || !canSubscribeToPlan}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : paymentStatus === "success" ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Success!
                        </>
                      ) : (
                        "Confirm Subscription"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-6 space-y-4">
                  <p className="text-zinc-600 text-center">
                    Connect your wallet to subscribe
                  </p>
                  <Button onClick={() => open()} size="lg" className="w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <p className="text-zinc-500">Initializing payment system...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
