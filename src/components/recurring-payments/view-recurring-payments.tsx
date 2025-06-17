"use client";

import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/date-utils";
import { api } from "@/trpc/react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export function ViewRecurringPayments() {
  const { data: recurringPayments, isLoading } =
    api.recurringPayment.getRecurringRequests.useQuery();
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);

  const togglePayments = (id: string) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPayments(newExpanded);
  };

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
    <div className="flex justify-center mx-auto w-full max-w-6xl">
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
                <TableHead>Frequency</TableHead>
                <TableHead>Total Payments</TableHead>
                <TableHead>Current Payments</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Payment History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.map((payment) => {
                const isExpanded = expandedPayments.has(payment.id);
                const payments = payment.payments || [];
                const visiblePayments = isExpanded
                  ? payments
                  : payments.slice(0, 3);

                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.recurrence?.startDate
                        ? payment.recurrence.startDate.toString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.recurrence?.frequency || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.totalNumberOfPayments || "Unlimited"}
                    </TableCell>
                    <TableCell>
                      {payment.currentNumberOfPayments || 0}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-xs">
                          {payment.recipient?.currencyAddress
                            ? `${payment.recipient.currencyAddress.substring(
                                0,
                                6,
                              )}...${payment.recipient.currencyAddress.substring(
                                payment.recipient.currencyAddress.length - 4,
                              )}`
                            : "N/A"}
                        </div>
                        <div className="text-sm">
                          {payment.recipient?.amount}{" "}
                          {payment.recipient?.currencySymbol}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {visiblePayments.map((pay) => (
                          <div
                            key={`recurring_payment_${payment.id}_payment_${pay.txHash}`}
                            className="text-xs space-y-1"
                          >
                            <div>{formatDate(pay.date)}</div>
                            <div className="font-mono text-zinc-500">
                              {pay.txHash.substring(0, 10)}...
                            </div>
                          </div>
                        ))}
                        {payments.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePayments(payment.id)}
                            className="h-6 px-2 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show {payments.length - 3} more
                              </>
                            )}
                          </Button>
                        )}
                      </div>
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
