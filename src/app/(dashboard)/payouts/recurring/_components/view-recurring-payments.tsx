"use client";

import { RecurringPaymentStatusBadge } from "@/components/recurring-payment-status-badge";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { formatDate } from "@/lib/date-utils";
import { useCancelRecurringPayment } from "@/lib/hooks/use-cancel-recurring-payment";
import { getCanCancelPayment } from "@/lib/helpers";
import type { RecurringPayment } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { AlertCircle, Ban, Eye, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { CompletedPayments } from "./blocks/completed-payments";
import { FrequencyBadge } from "./blocks/frequency-badge";

const ITEMS_PER_PAGE = 10;

interface ViewRecurringPaymentsProps {
  initialRecurringPayments: RecurringPayment[];
}

export function ViewRecurringPayments({
  initialRecurringPayments,
}: ViewRecurringPaymentsProps) {
  const utils = api.useUtils();

  const {
    data: recurringPayments,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = api.recurringPayment.getNonSubscriptionRecurringPayments.useQuery(
    undefined,
    {
      initialData: initialRecurringPayments,
    },
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(
    null,
  );
  const [cancelDialogOpenFor, setCancelDialogOpenFor] = useState<string | null>(
    null,
  );

  const { cancelRecurringPayment } = useCancelRecurringPayment({
    onSuccess: async () => {
      await utils.recurringPayment.getNonSubscriptionRecurringPayments.invalidate();
      setCancellingPaymentId(null);
      setCancelDialogOpenFor(null);
    },
  });

  const handleCancelRecurringPayment = async (payment: RecurringPayment) => {
    setCancellingPaymentId(payment.id);
    try {
      await cancelRecurringPayment(payment);
    } catch (error) {
      // Error is already handled by the hook, but we need to catch it here
      console.error("Failed to cancel recurring payment:", error);
    } finally {
      setCancellingPaymentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto w-full max-w-6xl">
        <Card className="w-full shadow-lg border border-border bg-card text-card-foreground">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-muted-foreground">
                Loading recurring payments...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center mx-auto w-full max-w-6xl">
        <Card className="w-full shadow-lg border border-destructive/30 bg-card text-card-foreground">
          <CardHeader className="bg-destructive/10 rounded-t-lg border-b border-destructive/30">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Recurring Payments
            </CardTitle>
          </CardHeader>

          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-destructive-foreground">
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
        <Card className="w-full shadow-lg border border-border bg-card text-card-foreground">
          <CardHeader className="bg-muted rounded-t-lg border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View Recurring Payouts
            </CardTitle>
          </CardHeader>

          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-muted-foreground">
                No recurring payouts found
              </p>
              <p className="text-muted-foreground text-sm">
                Your recurring payouts will appear here
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
      <Card className="w-full shadow-lg border border-border bg-card text-card-foreground">
        <CardHeader className="bg-muted rounded-t-lg border-b border-border">
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
                <TableHead>Payment amount</TableHead>
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
                const canCancel = getCanCancelPayment(payment.status);
                const isCurrentPaymentCancelling =
                  cancellingPaymentId === payment.id;

                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.recurrence?.startDate
                        ? formatDate(
                            new Date(
                              payment.recurrence.startDate,
                            ).toISOString(),
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <RecurringPaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <FrequencyBadge
                        frequency={payment.recurrence.frequency}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold">
                        {payment.totalAmount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-bold">
                          {payment.totalNumberOfPayments}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          scheduled
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-bold">
                          {payment.currentNumberOfPayments}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          completed
                        </span>
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
                      <AlertDialog
                        open={cancelDialogOpenFor === payment.id}
                        onOpenChange={(open) =>
                          setCancelDialogOpenFor(open ? payment.id : null)
                        }
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelDialogOpenFor(payment.id)}
                          disabled={!canCancel || isCurrentPaymentCancelling}
                          className="h-8 w-8 p-0"
                        >
                          {isCurrentPaymentCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {isCurrentPaymentCancelling
                              ? "Cancelling..."
                              : "Cancel Payment"}
                          </span>
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel Recurring Payment
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this recurring
                              payment? This action cannot be undone and will
                              stop all future payments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={isCurrentPaymentCancelling}
                            >
                              Keep Payment
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleCancelRecurringPayment(payment)
                              }
                              disabled={isCurrentPaymentCancelling}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {isCurrentPaymentCancelling
                                ? "Cancelling..."
                                : "Cancel Payment"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {recurringPayments.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
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
