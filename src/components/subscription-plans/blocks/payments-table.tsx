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
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import type { SubscriptionPayment } from "@/lib/types";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import {
  CreditCard,
  DollarSign,
  ExternalLink,
  Filter,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../../dashboard/blocks/empty-state";
import { Pagination } from "../../dashboard/blocks/pagination";
import { StatCard } from "../../dashboard/blocks/stat-card";
import { TableHeadCell } from "../../dashboard/blocks/table-head-cell";

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
    <TableHeadCell>Subscriber</TableHeadCell>
    <TableHeadCell>Request Scan URL</TableHeadCell>
  </TableRow>
);

const PaymentRow = ({ payment }: { payment: SubscriptionPayment }) => {
  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell>
        {format(new Date(payment.createdAt), "do MMM yyyy")}
      </TableCell>
      <TableCell className="font-medium">{payment.planName}</TableCell>
      <TableCell>{formatCurrencyLabel(payment.currency)}</TableCell>
      <TableCell>
        <span className="font-semibold">
          {Number(payment.amount).toLocaleString()} ${payment.currency}
        </span>
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
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm">View Request</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-zinc-400 text-sm">N/A</span>
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

  const { data: payments } = api.subscriptionPlan.getAllPayments.useQuery(
    undefined,
    {
      initialData: initialPayments,
      refetchOnMount: true,
    },
  );

  const filteredPayments = activePlan
    ? payments.filter((payment) => payment.planId === activePlan)
    : payments;

  const totalRevenue = filteredPayments.reduce((sum, payment) => {
    return sum + Number(payment.amount);
  }, 0);

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
          icon={<Receipt className="h-4 w-4 text-zinc-600" />}
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

      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <PaymentTableColumns />
            </TableHeader>
            <TableBody>
              {!filteredPayments || filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={<CreditCard className="h-6 w-6 text-zinc-600" />}
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
          {filteredPayments && filteredPayments.length > ITEMS_PER_PAGE && (
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
