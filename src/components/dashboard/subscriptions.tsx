"use client";

import { ShortAddress } from "@/components/short-address";
import { Card, CardContent } from "@/components/ui/card";
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
import { useCancelRecurringPayment } from "@/lib/hooks/use-cancel-recurring-payment";
import { getCanCancelPayment } from "@/lib/utils";
import type { RecurringPayment } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { addDays, format } from "date-fns";
import {
  AlertCircle,
  Ban,
  CreditCard,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { StatusBadge } from "../view-recurring-payments/blocks/status-badge";
import { EmptyState } from "./blocks/empty-state";
import { Pagination } from "./blocks/pagination";
import { StatCard } from "./blocks/stat-card";
import { TableHeadCell } from "./blocks/table-head-cell";

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
  const utils = api.useUtils();

  const { cancelRecurringPayment, isLoading: isCancelling } =
    useCancelRecurringPayment({
      confirmMessage: "Are you sure you want to cancel this subscription?",
      onSuccess: async () => {
        await utils.subscriptionPlan.getAll.invalidate();
      },
    });

  const handleCancelRecurringPayment = async () => {
    if (isCancelling) return;

    await cancelRecurringPayment(subscription);
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
            {Number(subscription.totalAmount).toLocaleString()} $
            {subscription.paymentCurrency}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <CompletedPayments payments={subscription.payments || []} />
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancelRecurringPayment}
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
      </TableCell>
    </TableRow>
  );
};

export type SubscriptionWithDetails = RecurringPayment & {
  subscription: {
    label: string;
    id: string;
    trialDays: number;
  } | null;
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

  const totalSpent =
    subscriptions?.reduce((sum, sub) => {
      if (ACTIVE_STATUSES.includes(sub.status)) {
        return sum + Number(sub.totalAmount || 0);
      }
      return sum;
    }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={
            subscriptions.filter((sub) => ACTIVE_STATUSES.includes(sub.status))
              .length || 0
          }
          icon={<CreditCard className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Total Plans"
          value={subscriptions?.length || 0}
          icon={<AlertCircle className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
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
                  <TableCell colSpan={7} className="p-0">
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
