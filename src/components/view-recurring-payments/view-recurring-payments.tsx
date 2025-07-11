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
import type { RecurringPayment } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { AlertCircle, Ban, Eye, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ShortAddress } from "../short-address";
import { FrequencyBadge } from "./blocks/frequency-badge";
import { StatusBadge } from "./blocks/status-badge";

const getCanCancelPayment = (status: string) => {
  return status === "pending" || status === "active";
};
const ITEMS_PER_PAGE = 10;

interface ViewRecurringPaymentsProps {
  initialRecurringPayments?: RecurringPayment[];
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
  } = api.recurringPayment.getRecurringPayments.useQuery(undefined, {
    initialData: initialRecurringPayments,
  });

  const updateRecurringPaymentMutation =
    api.recurringPayment.updateRecurringPayment.useMutation({
      onSuccess: () => {
        toast.success("Recurring payment cancelled successfully");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to cancel recurring payment: ${error.message}`);
      },
    });
  const setRecurringPaymentStatusMutation =
    api.recurringPayment.setRecurringPaymentStatus.useMutation({});

  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(
    null,
  );

  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const handleCancelRecurringPayment = async (payment: RecurringPayment) => {
    if (!getCanCancelPayment(payment.status)) {
      return;
    }

    if (!isConnected || !walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!confirm("Are you sure you want to cancel this recurring payment?")) {
      return;
    }

    setCancellingPaymentId(payment.id);

    try {
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
      const signer = ethersProvider.getSigner();

      toast.info("Cancelling recurring payment...");

      const response = await updateRecurringPaymentMutation.mutateAsync({
        externalPaymentId: payment.externalPaymentId,
        action: "cancel",
      });

      const { transactions } = response;

      if (transactions?.length) {
        toast.info("Signature required", {
          description: "Please sign the transactions in your wallet",
        });

        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];

          toast.info(
            `Processing transaction ${i + 1} of ${transactions.length}`,
            {
              description: "Please confirm the transaction in your wallet",
            },
          );

          const txResponse = await signer.sendTransaction(transaction);
          await txResponse.wait();

          toast.success(`Transaction ${i + 1} completed`);
        }

        toast.success("All transactions completed successfully");
      }

      await setRecurringPaymentStatusMutation.mutateAsync({
        id: payment.id,
        status: "cancelled",
      });

      await utils.recurringPayment.getRecurringPayments.invalidate();
      toast.success("Recurring payment cancelled successfully");
    } catch (error) {
      console.error("Cancel recurring payment error:", error);
      toast.error("Failed to cancel recurring payment", {
        description:
          "There was an error cancelling your recurring payment. Please try again.",
      });
    } finally {
      setCancellingPaymentId(null);
    }
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
                <TableHead>Total amount</TableHead>
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
                const isCancelling = cancellingPaymentId === payment.id;

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
                      <span className="text-sm font-bold">
                        {payment.totalAmount}
                      </span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRecurringPayment(payment)}
                        disabled={
                          !canCancel ||
                          isCancelling ||
                          updateRecurringPaymentMutation.isLoading
                        }
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
