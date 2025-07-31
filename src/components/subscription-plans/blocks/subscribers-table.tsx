"use client";

import { MultiCurrencyStatCard } from "@/components/multi-currency-stat-card";
import { ShortAddress } from "@/components/short-address";
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
import type { SubscriptionWithDetails } from "@/lib/types";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { addDays, format } from "date-fns";
import { BigNumber } from "ethers";
import { CreditCard, DollarSign, Filter } from "lucide-react";
import { useState } from "react";
import { StatCard } from "../../stat-card";
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
    <TableHeadCell>Subscriber</TableHeadCell>
    <TableHeadCell>Payment History</TableHeadCell>
  </TableRow>
);

const SubscriberRow = ({
  subscription,
}: { subscription: SubscriptionWithDetails }) => {
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

  const totalAmount = BigNumber.from(subscription.totalAmount || "0");

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
      <TableCell>{getTrialEndDate()}</TableCell>
      <TableCell>
        <FrequencyBadge frequency={subscription.recurrence.frequency} />
      </TableCell>
      <TableCell>
        {formatCurrencyLabel(subscription.paymentCurrency || "")}
      </TableCell>
      <TableCell>
        <span className="font-semibold">
          {totalAmount.toString()} {subscription.paymentCurrency}
        </span>
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
            icon={<CreditCard className="h-4 w-4 text-zinc-600" />}
          />
          <MultiCurrencyStatCard
            title="Total Revenue"
            icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
            values={[]}
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
  ).length;

  const revenuesByCurrency = filteredSubscribers.reduce(
    (acc, sub) => {
      if (
        ACTIVE_STATUSES.includes(sub.status) &&
        sub.payments &&
        sub.paymentCurrency
      ) {
        const currency = sub.paymentCurrency;
        try {
          const totalAmount = BigNumber.from(sub.totalAmount || "0");
          const paymentsCount = BigNumber.from(sub.payments.length.toString());
          // ASSUMPTION: This calculation assumes each payment equals the full totalAmount.
          // This is correct for our current system which does not support partial recurring payments.
          // If partial payments are implemented in the future, this logic must be updated to sum
          // actual payment amounts from the payments array instead of multiplying by count.
          const revenue = totalAmount.mul(paymentsCount);

          if (!acc[currency]) {
            acc[currency] = BigNumber.from("0");
          }
          acc[currency] = acc[currency].add(revenue);
        } catch (error) {
          console.error("Error calculating revenue:", error);
        }
      }
      return acc;
    },
    {} as Record<string, BigNumber>,
  );

  const revenueValues = Object.entries(revenuesByCurrency)
    .map(([currency, amount]) => ({
      amount: amount.toString(),
      currency,
    }))
    .filter((value) => BigNumber.from(value.amount).gt(0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={activeSubscribers}
          icon={<CreditCard className="h-4 w-4 text-zinc-600" />}
        />
        <MultiCurrencyStatCard
          title="Total Revenue"
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
          values={revenueValues}
        />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-600" />
          <span className="text-sm font-medium text-zinc-700">
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

      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <SubscriberTableColumns />
            </TableHeader>
            <TableBody>
              {filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={<CreditCard className="h-6 w-6 text-zinc-600" />}
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
