"use client";

import { ShortAddress } from "@/components/short-address";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/ui/table/error-state";
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
import { consolidateRecurringPaymentUsdValues } from "@/lib/helpers/conversion";
import type { SubscriptionWithDetails } from "@/lib/types";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { addDays, format } from "date-fns";
import { utils } from "ethers";
import { CreditCard, DollarSign, Filter, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../../ui/table/empty-state";
import { TableHeadCell } from "../../ui/table/table-head-cell";

interface SubscribersTableProps {
  initialSubscribers: SubscriptionWithDetails[];
  subscriptionPlans: SubscriptionPlan[];
}

const ACTIVE_STATUSES = ["pending", "active"];

const SubscriberTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Start Date</TableHeadCell>
    <TableHeadCell>Plan Name</TableHeadCell>
    <TableHeadCell>Trial Info</TableHeadCell>
    <TableHeadCell>Frequency</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Total Payments</TableHeadCell>
    <TableHeadCell>Current Payment</TableHeadCell>
    <TableHeadCell>Subscriber</TableHeadCell>
    <TableHeadCell>Payment History</TableHeadCell>
  </TableRow>
);

const SubscriberRow = ({
  subscription,
}: {
  subscription: SubscriptionWithDetails;
}) => {
  const getTrialEndDate = () => {
    if (!subscription.subscription?.trialDays) return "No trial";
    if (!subscription.createdAt) return "No trial";

    try {
      const trialEndDate = addDays(
        new Date(subscription.createdAt),
        subscription.subscription.trialDays,
      );
      return `${subscription.subscription.trialDays} days (ends ${format(
        trialEndDate,
        "do MMM yyyy",
      )})`;
    } catch (error) {
      console.error("Error formatting trial end date:", error);
      return "No trial";
    }
  };

  const totalAmount = utils.parseUnits(subscription.totalAmount || "0", 18);
  const displayAmount = utils.formatUnits(totalAmount, 18);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        {subscription.createdAt
          ? format(new Date(subscription.createdAt), "do MMM yyyy")
          : "N/A"}
      </TableCell>
      <TableCell className="font-medium">
        {subscription.subscription?.label || "Unnamed Plan"}
      </TableCell>
      <TableCell>{getTrialEndDate()}</TableCell>
      <TableCell>
        <FrequencyBadge frequency={subscription.recurrence.frequency} />
      </TableCell>
      <TableCell>
        {formatCurrencyLabel(subscription.paymentCurrency || "")}
      </TableCell>
      <TableCell>
        <span className="font-semibold">
          {displayAmount} {subscription.paymentCurrency}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-bold">
            {subscription.totalNumberOfPayments}
          </span>
          <span className="text-xs text-muted-foreground">scheduled</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-bold">
            {subscription.currentNumberOfPayments}
          </span>
          <span className="text-xs text-muted-foreground">completed</span>
        </div>
      </TableCell>
      <TableCell>
        <ShortAddress address={subscription.payer} />
      </TableCell>
      <TableCell>
        <CompletedPayments payments={subscription.payments || []} />
      </TableCell>
    </TableRow>
  );
};

export function SubscribersTable({
  initialSubscribers,
  subscriptionPlans,
}: SubscribersTableProps) {
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const {
    data: allSubscribers,
    error,
    refetch,
    isRefetching,
  } = api.subscriptionPlan.getAllSubscribers.useQuery(undefined, {
    initialData: initialSubscribers,
    refetchOnMount: true,
    refetchInterval: 3000,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Active Subscriptions"
            value="--"
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Total Revenue"
            value="--"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <ErrorState
          onRetry={refetch}
          isRetrying={isRefetching}
          explanation="We couldn't load the subscriber data. Please try again."
        />
      </div>
    );
  }

  const filteredSubscribers = activePlan
    ? allSubscribers.filter(
        (subscriber) => subscriber.subscription?.id === activePlan,
      )
    : allSubscribers;

  const activeSubscribers = filteredSubscribers.filter((sub) =>
    ACTIVE_STATUSES.includes(sub.status),
  );

  let totalRevenue = 0;
  let hasNonUsdValues = false;

  for (const sub of activeSubscribers) {
    if (!sub.payments || sub.payments.length === 0) continue;

    const { totalInUsd, hasNonUsdValues: subHasNonUsdValues } =
      consolidateRecurringPaymentUsdValues(
        sub.totalAmount,
        sub.paymentCurrency,
        sub.payments || [],
      );

    totalRevenue += Number(totalInUsd);
    if (subHasNonUsdValues) {
      hasNonUsdValues = true;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={`${activeSubscribers.length}`}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="relative">
          <StatCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          {hasNonUsdValues && (
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground">
                * Excludes non-USD subscriptions without conversion info
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Filter by plan:
          </span>
        </div>
        <Select
          value={activePlan || "all"}
          onValueChange={(value) =>
            setActivePlan(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {subscriptionPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <SubscriberTableColumns />
            </TableHeader>
            <TableBody>
              {filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState
                      icon={<Users className="h-6 w-6 text-muted-foreground" />}
                      title="No subscribers"
                      subtitle={
                        activePlan
                          ? "No subscribers found for the selected plan"
                          : "No subscribers found across all plans"
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers.map((subscription) => (
                  <SubscriberRow
                    key={subscription.id}
                    subscription={subscription}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
