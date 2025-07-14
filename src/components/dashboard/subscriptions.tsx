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
import type { RecurringPayment } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { AlertCircle, CreditCard, DollarSign } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "./blocks/empty-state";
import { Pagination } from "./blocks/pagination";
import { StatCard } from "./blocks/stat-card";
import { TableHeadCell } from "./blocks/table-head-cell";

const ITEMS_PER_PAGE = 10;

const SubscriptionTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Start Date</TableHeadCell>
    <TableHeadCell>Plan Name</TableHeadCell>
    <TableHeadCell>Frequency</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Chain</TableHeadCell>
    <TableHeadCell>Recipient</TableHeadCell>
    <TableHeadCell>Payment History</TableHeadCell>
  </TableRow>
);

const SubscriptionRow = ({ subscription }: { subscription: any }) => {
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
        <FrequencyBadge
          frequency={subscription.subscription?.recurrenceFrequency}
        />
      </TableCell>
      <TableCell>
        {formatCurrencyLabel(subscription.subscription?.paymentCurrency || "")}
      </TableCell>
      <TableCell>{subscription.subscription?.chain || "N/A"}</TableCell>
      <TableCell>
        <div className="space-y-1">
          <ShortAddress address={subscription.subscription?.recipient || ""} />
          <div className="text-sm">
            {subscription.subscription?.amount
              ? `${Number(subscription.subscription.amount).toLocaleString()} ${subscription.subscription.paymentCurrency}`
              : "N/A"}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <CompletedPayments payments={subscription.payments || []} />
      </TableCell>
    </TableRow>
  );
};

interface SubscriptionProps {
  initialSubscriptions: Array<
    RecurringPayment & {
      subscription: {
        label: string;
        id: string;
      };
    }
  >;
}

export const Subscriptions = ({ initialSubscriptions }: SubscriptionProps) => {
  const [page, setPage] = useState(1);

  const { data: subscriptions } =
    api.subscriptionPlan.getUserActiveSubscriptions.useQuery(undefined, {
      initialData: initialSubscriptions,
    });

  const totalSpent =
    subscriptions?.reduce(
      (sum, sub) => sum + Number(sub.totalAmount || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={subscriptions?.length || 0}
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
