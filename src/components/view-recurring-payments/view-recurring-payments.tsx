"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompletedPayments } from "@/components/view-recurring-payments/blocks/completed-payments";
import { formatDate } from "@/lib/date-utils";
import { api } from "@/trpc/react";
import { AlertCircle, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ShortAddress } from "../short-address";
import { FrequencyBadge } from "./blocks/frequency-badge";
import { StatusBadge } from "./blocks/status-badge";

const ITEMS_PER_PAGE = 10;

export function ViewRecurringPayments() {
  const {
    data: recurringPayments,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = api.recurringPayment.getRecurringRequests.useQuery();
  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto w-full max-w-6xl">
        <Card className="w-full shadow-lg border-zinc-200/80">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-zinc-500">Loading recurring payments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center mx-auto w-full max-w-6xl">
        <Card className="w-full shadow-lg border-red-200/80">
          <CardHeader className="bg-red-50 rounded-t-lg border-b border-red-200/80">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Error Loading Recurring Payments
            </CardTitle>
          </CardHeader>

          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-red-600">
                {error.message || "Failed to load recurring payments"}
              </p>
              <Button
                onClick={() => refetch()}
                disabled={isRefetching}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
                />
                {isRefetching ? "Retrying..." : "Try Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recurringPayments || recurringPayments.length === 0) {
    return (
      <div className="flex justify-center mx-auto w-full max-w-6xl">
        <Card className="w-full shadow-lg border-zinc-200/80">
          <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View Recurring Payments
            </CardTitle>
          </CardHeader>

          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-zinc-500">No recurring payments found</p>
              <p className="text-zinc-400 text-sm">
                Your recurring payments will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.max(
    1,
    Math.ceil(recurringPayments.length / ITEMS_PER_PAGE),
  );
  const paginatedPayments = recurringPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex justify-center mx-auto w-full">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View Recurring Payments ({recurringPayments.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Total Payments</TableHead>
                <TableHead>Current Payments</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Payment History</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.map((payment) => {
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.recurrence?.startDate
                        ? formatDate(payment.recurrence.startDate.toString())
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <FrequencyBadge
                        frequency={payment.recurrence.frequency}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-bold">
                          {payment.totalNumberOfPayments}
                        </span>
                        <span className="text-xs text-zinc-500">scheduled</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-bold">
                          {payment.currentNumberOfPayments}
                        </span>
                        <span className="text-xs text-zinc-500">completed</span>
                      </div>
                    </TableCell>
                    <TableCell>{payment.chain}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <ShortAddress address={payment.recipient.address} />
                        <div className="text-sm">
                          {payment.recipient.amount} {payment.paymentCurrency}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CompletedPayments payments={payment.payments || []} />
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="w-full">
                        Pause
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {recurringPayments.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-sm"
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
