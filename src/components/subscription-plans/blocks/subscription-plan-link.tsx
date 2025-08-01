"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import { useCancelRecurringPayment } from "@/lib/hooks/use-cancel-recurring-payment";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { BigNumber } from "ethers";
import { Copy, DollarSign, ExternalLink, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SubscriptionPlanLinkProps {
  plan: SubscriptionPlan;
}

export function SubscriptionPlanLink({ plan }: SubscriptionPlanLinkProps) {
  const [mounted, setMounted] = useState(false);
  const trpcContext = api.useUtils();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  // need to do this because of hydration issues with Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  const { mutateAsync: deleteSubscriptionPlan } =
    api.subscriptionPlan.delete.useMutation({
      onSuccess: () => {
        trpcContext.subscriptionPlan.getAll.invalidate();
        trpcContext.subscriptionPlan.getAllSubscribers.invalidate();
        trpcContext.subscriptionPlan.getAllPayments.invalidate();
      },
    });

  const { data: recurringPayments } =
    api.subscriptionPlan.getSubscribersForPlan.useQuery(plan.id);

  const { cancelRecurringPayment, isLoading: isCancellingPayment } =
    useCancelRecurringPayment({
      onSuccess: async () => {
        await trpcContext.subscriptionPlan.getSubscribersForPlan.invalidate(
          plan.id,
        );
        await trpcContext.subscriptionPlan.getAllSubscribers.invalidate();
      },
    });

  const totalNumberOfSubscribers = recurringPayments?.length || 0;
  const totalAmount =
    recurringPayments?.reduce((sum, recurringPayment) => {
      try {
        const amount = BigNumber.from(recurringPayment.totalAmount || "0");
        return sum.add(amount);
      } catch (error) {
        console.error("Error parsing totalAmount:", error);
        return sum;
      }
    }, BigNumber.from("0")) || BigNumber.from("0");

  const linkUrl = mounted
    ? `${window.location.origin}/s/${plan.id}`
    : `/s/${plan.id}`;

  const copyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
        toast.error("Failed to copy link");
      });
  };

  const handleDeletePlan = async () => {
    setIsDeletingPlan(true);
    try {
      if (recurringPayments && recurringPayments.length > 0) {
        toast.info(
          `Cancelling ${recurringPayments.length} active subscription(s)...`,
        );

        for (const payment of recurringPayments) {
          await cancelRecurringPayment(payment, plan.id);
        }
      }

      await deleteSubscriptionPlan(plan.id);
      toast.success(
        "Subscription plan deactivated and all active subscriptions cancelled successfully",
      );
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to deactivate subscription plan", {
        description:
          "Please try again later or contact support if the problem persists.",
      });
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const displayCurrency = formatCurrencyLabel(plan.paymentCurrency);
  const isProcessing = isDeletingPlan || isCancellingPayment;

  return (
    <Card className="overflow-hidden bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-zinc-900">{plan.label}</h3>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{totalNumberOfSubscribers} subscriber(s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {totalAmount.toString()} {displayCurrency} total
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-600">
              {plan.amount} {displayCurrency} · {plan.recurrenceFrequency} ·{" "}
              {plan.trialDays > 0
                ? `${plan.trialDays} day${plan.trialDays > 1 ? "s" : ""} trial`
                : "No trial"}{" "}
            </p>
            <code className="text-xs text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-md truncate flex-1">
              {linkUrl}
            </code>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyLink(linkUrl)}
              className="h-8 w-8 p-0 hover:bg-zinc-100"
              title="Copy link"
              disabled={isProcessing}
            >
              <Copy className="h-4 w-4 text-zinc-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0 hover:bg-zinc-100"
              title="Open link"
            >
              <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 text-zinc-600" />
              </Link>
            </Button>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Deactivate subscription plan"
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Deactivate Subscription Plan
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Are you sure you want to deactivate this subscription
                      plan? This will make the plan unavailable for new
                      subscriptions.
                    </p>
                    {totalNumberOfSubscribers > 0 && (
                      <p className="font-medium text-amber-600">
                        ⚠️ This will cancel all {totalNumberOfSubscribers} active
                        subscription(s) and stop all upcoming payments for this
                        plan.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isProcessing}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePlan}
                    disabled={isProcessing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isProcessing ? "Deactivating..." : "Deactivate Plan"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
