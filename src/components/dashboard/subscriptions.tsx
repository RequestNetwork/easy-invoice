"use client";

import { ShortAddress } from "@/components/short-address";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { CompletedPayments } from "@/components/view-recurring-payments/blocks/completed-payments";
import { FrequencyBadge } from "@/components/view-recurring-payments/blocks/frequency-badge";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import { useCancelRecurringPayment } from "@/lib/hooks/use-cancel-recurring-payment";
import type { SubscriptionWithDetails } from "@/lib/types";
import { getCanCancelPayment } from "@/lib/utils";
import { api } from "@/trpc/react";
import { addDays, format } from "date-fns";
import { BigNumber, utils } from "ethers";
import { Ban, CreditCard, DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { MultiCurrencyStatCard } from "../multi-currency-stat-card";
import { StatCard } from "../stat-card";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/table/empty-state";
import { Pagination } from "../ui/table/pagination";
import { TableHeadCell } from "../ui/table/table-head-cell";
import { StatusBadge } from "../view-recurring-payments/blocks/status-badge";

const ITEMS_PER_PAGE = 10;
const ACTIVE_STATUSES = ["pending", "active"];

const SubscriptionTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Start Date</TableHeadCell>
    <TableHeadCell>Plan Name</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
    <TableHeadCell>Trial Info</TableHeadCell>
    <TableHeadCell>Frequency</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Chain</TableHeadCell>
    <TableHeadCell>Recipient</TableHeadCell>
    <TableHeadCell>Payment History</TableHeadCell>
  </TableRow>
);

const SubscriptionRow = ({
  subscription,
}: { subscription: SubscriptionWithDetails }) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const utils = api.useUtils();

  const { cancelRecurringPayment, isLoading: isCancelling } =
    useCancelRecurringPayment({
      onSuccess: async () => {
        await utils.subscriptionPlan.getAll.invalidate();
        await utils.subscriptionPlan.getUserActiveSubscriptions.invalidate();
        setIsCancelDialogOpen(false);
      },
    });

  const handleCancelRecurringPayment = async () => {
    try {
      await cancelRecurringPayment(subscription);
    } catch (error) {
      // Error is already handled by the hook, but we need to catch it here
      console.error("Failed to cancel subscription:", error);
    }
  };

  const getTrialEndDate = () => {
    if (!subscription.subscription?.trialDays) return "No trial";

    if (!subscription.createdAt) return "No trial";
    const trialEndDate = addDays(
      new Date(subscription.createdAt),
      subscription.subscription.trialDays,
    );
    return format(trialEndDate, "do MMM yyyy");
  };

  const canCancel = getCanCancelPayment(subscription.status);

  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell>
        {subscription.createdAt
          ? format(new Date(subscription.createdAt), "do MMM yyyy")
          : "N/A"}
      </TableCell>
      <TableCell className="font-medium">
        {subscription.subscription?.label || "Unnamed Plan"}
      </TableCell>
      <TableCell>
        <StatusBadge status={subscription.status} />
      </TableCell>
      <TableCell>
        {subscription.subscription?.trialDays
          ? `${subscription.subscription.trialDays} days (ends ${getTrialEndDate()})`
          : "No trial"}
      </TableCell>
      <TableCell>
        <FrequencyBadge frequency={subscription.recurrence.frequency} />
      </TableCell>
      <TableCell>
        {formatCurrencyLabel(subscription.paymentCurrency || "")}
      </TableCell>
      <TableCell>{subscription.chain || "N/A"}</TableCell>
      <TableCell>
        <div className="space-y-1">
          <ShortAddress address={subscription.recipient.address || ""} />
          <div className="text-sm">
            {subscription.totalAmount} {subscription.paymentCurrency}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <CompletedPayments payments={subscription.payments || []} />
      </TableCell>
      <TableCell>
        <AlertDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCancelDialogOpen(true)}
            disabled={!canCancel || isCancelling}
            className="h-8 w-8 p-0"
          >
            {isCancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isCancelling ? "Cancelling..." : "Cancel Payment"}
            </span>
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this subscription? This action
                cannot be undone and will stop all future payments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                Keep Subscription
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelRecurringPayment}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

interface SubscriptionProps {
  initialSubscriptions: SubscriptionWithDetails[];
}

export const Subscriptions = ({ initialSubscriptions }: SubscriptionProps) => {
  const [page, setPage] = useState(1);

  const { data: subscriptions } =
    api.subscriptionPlan.getUserActiveSubscriptions.useQuery(undefined, {
      initialData: initialSubscriptions,
    });

  const commitmentsByCurrency =
    subscriptions?.reduce(
      (acc, sub) => {
        if (ACTIVE_STATUSES.includes(sub.status) && sub.paymentCurrency) {
          const currency = sub.paymentCurrency;
          try {
            const nextPaymentAmount = utils.parseUnits(sub.totalAmount, 18);
            if (!acc[currency]) {
              acc[currency] = BigNumber.from("0");
            }
            acc[currency] = acc[currency].add(nextPaymentAmount);
          } catch (error) {
            console.error("Error calculating commitment amount:", error);
          }
        }
        return acc;
      },
      {} as Record<string, BigNumber>,
    ) || {};

  const totalSpentByCurrency =
    subscriptions?.reduce(
      (acc, sub) => {
        if (sub.payments && sub.payments.length > 0 && sub.paymentCurrency) {
          const currency = sub.paymentCurrency;
          try {
            const paymentAmount = utils.parseUnits(sub.totalAmount, 18);
            const completedPayments = BigNumber.from(
              sub.payments.length.toString(),
            );
            const totalSpent = paymentAmount.mul(completedPayments);

            if (!acc[currency]) {
              acc[currency] = BigNumber.from("0");
            }
            acc[currency] = acc[currency].add(totalSpent);
          } catch (error) {
            console.error("Error calculating total spent:", error);
          }
        }
        return acc;
      },
      {} as Record<string, BigNumber>,
    ) || {};

  const commitmentValues = Object.entries(commitmentsByCurrency).map(
    ([currency, amount]) => ({
      amount: utils.formatUnits(amount, 18),
      currency,
    }),
  );

  const spentValues = Object.entries(totalSpentByCurrency).map(
    ([currency, amount]) => ({
      amount: utils.formatUnits(amount, 18),
      currency,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={
            subscriptions?.filter((sub) => ACTIVE_STATUSES.includes(sub.status))
              .length || 0
          }
          icon={<CreditCard className="h-4 w-4 text-zinc-600" />}
        />
        <MultiCurrencyStatCard
          title="Subscription Commitments"
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
          values={commitmentValues}
        />
        <MultiCurrencyStatCard
          title="Total Spent"
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
          values={spentValues}
        />
      </div>

      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <SubscriptionTableColumns />
            </TableHeader>
            <TableBody>
              {!subscriptions || subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState
                      icon={<CreditCard className="h-6 w-6 text-zinc-600" />}
                      title="No active subscriptions"
                      subtitle="You haven't subscribed to any plans yet"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions
                  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                  .map((subscription) => (
                    <SubscriptionRow
                      key={subscription.id}
                      subscription={subscription}
                    />
                  ))
              )}
            </TableBody>
          </Table>
          {subscriptions && subscriptions.length > 0 && (
            <Pagination
              page={page}
              setPage={setPage}
              totalItems={subscriptions.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
