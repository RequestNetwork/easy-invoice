"use client";

import { ShortAddress } from "@/components/short-address";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompletedPayments } from "@/components/view-recurring-payments/blocks/completed-payments";
import { FrequencyBadge } from "@/components/view-recurring-payments/blocks/frequency-badge";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import type { SubscriptionWithDetails } from "@/lib/types";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { addDays, format } from "date-fns";
import { CreditCard, DollarSign, Filter } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../../dashboard/blocks/empty-state";
import { StatCard } from "../../dashboard/blocks/stat-card";
import { TableHeadCell } from "../../dashboard/blocks/table-head-cell";

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

    const trialEndDate = addDays(
      new Date(subscription.createdAt),
      subscription.subscription.trialDays,
    );
    return format(trialEndDate, "do MMM yyyy");
  };

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
      <TableCell>
        <div className="space-y-1">
          <ShortAddress address={subscription.payer} />
          <div className="text-sm">
            {Number(subscription.totalAmount).toLocaleString()} $
            {subscription.paymentCurrency}
          </div>
        </div>
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

  const { data: allSubscribers } =
    api.subscriptionPlan.getAllSubscribers.useQuery(undefined, {
      initialData: initialSubscribers,
      refetchOnMount: true,
    });

  const filteredSubscribers = activePlan
    ? allSubscribers.filter(
        (subscriber) => subscriber.subscription?.id === activePlan,
      )
    : allSubscribers;

  const activeSubscribers = filteredSubscribers.filter((sub) =>
    ACTIVE_STATUSES.includes(sub.status),
  ).length;

  const totalRevenue = filteredSubscribers.reduce((sum, sub) => {
    if (ACTIVE_STATUSES.includes(sub.status)) {
      return sum + Number(sub.totalAmount || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={activeSubscribers}
          icon={<CreditCard className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
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
              {!filteredSubscribers || filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
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
