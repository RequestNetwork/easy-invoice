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
import { EmptyState } from "@/components/ui/table/empty-state";
import { ErrorState } from "@/components/ui/table/error-state";
import { Pagination } from "@/components/ui/table/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { TableHeadCell } from "@/components/ui/table/table-head-cell";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import { consolidateSubscriptionPaymentUsdValues } from "@/lib/helpers/conversion";
import type { SubscriptionPayment } from "@/lib/types";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { utils } from "ethers";
import {
  CreditCard,
  DollarSign,
  ExternalLink,
  Filter,
  Receipt,
} from "lucide-react";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

interface PaymentsTableProps {
  initialPayments: SubscriptionPayment[];
  subscriptionPlans: SubscriptionPlan[];
}

const PaymentTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Payment Date</TableHeadCell>
    <TableHeadCell>Plan Name</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Payment Number</TableHeadCell>
    <TableHeadCell>Subscriber</TableHeadCell>
    <TableHeadCell>Request Scan URL</TableHeadCell>
  </TableRow>
);

const PaymentRow = ({ payment }: { payment: SubscriptionPayment }) => {
  const paymentAmount = utils.parseUnits(payment.amount, 18);
  const displayAmount = utils.formatUnits(paymentAmount, 18);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        {format(new Date(payment.createdAt), "do MMM yyyy")}
      </TableCell>
      <TableCell className="font-medium">{payment.planName}</TableCell>
      <TableCell>{formatCurrencyLabel(payment.currency)}</TableCell>
      <TableCell>
        <span className="font-semibold">
          {displayAmount} {payment.currency}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-bold">{payment.paymentNumber}</span>
          <span className="text-xs text-muted-foreground">
            of {payment.totalNumberOfPayments}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <ShortAddress address={payment.subscriber} />
      </TableCell>
      <TableCell>
        {payment.requestScanUrl ? (
          <a
            href={payment.requestScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm">View Request</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export function PaymentsTable({
  initialPayments,
  subscriptionPlans,
}: PaymentsTableProps) {
  const [page, setPage] = useState(1);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const {
    data: payments,
    error,
    refetch,
    isRefetching,
  } = api.subscriptionPlan.getAllPayments.useQuery(undefined, {
    initialData: initialPayments,
    refetchOnMount: true,
    refetchInterval: 3000,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Total Payments"
            value="--"
            icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
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
          explanation="We couldn't load the payment data. Please try again."
        />
      </div>
    );
  }

  const filteredPayments = activePlan
    ? payments.filter((payment) => payment.planId === activePlan)
    : payments;

  const { totalInUsd, hasNonUsdValues } =
    consolidateSubscriptionPaymentUsdValues(filteredPayments);

  const paginatedPayments = filteredPayments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handlePlanChange = (value: string) => {
    setActivePlan(value === "all" ? null : value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Payments"
          value={filteredPayments.length}
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="relative">
          <StatCard
            title="Total Revenue"
            value={`$${Number(totalInUsd).toLocaleString()}`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          {hasNonUsdValues && (
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground">
                * Excludes non-USD invoices without conversion info
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
        <Select value={activePlan || "all"} onValueChange={handlePlanChange}>
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
              <PaymentTableColumns />
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      }
                      title="No payments"
                      subtitle={
                        activePlan
                          ? "No payments found for the selected plan"
                          : "No payments have been received yet"
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))
              )}
            </TableBody>
          </Table>
          {filteredPayments.length > ITEMS_PER_PAGE && (
            <Pagination
              page={page}
              setPage={setPage}
              totalItems={filteredPayments.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
