"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table/table";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import {
  getInvoiceTableStatusClass,
  getStatusDisplayText,
} from "@/lib/invoice-status";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { format, isPast } from "date-fns";
import { Ban, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface InvoiceRowProps {
  invoice: Request;
  type: "sent" | "received";
  children?: React.ReactNode;
}

export const InvoiceRow = ({ invoice, type, children }: InvoiceRowProps) => {
  const [isStopRecurrenceDialogOpen, setIsStopRecurrenceDialogOpen] =
    useState(false);
  const utils = api.useUtils();
  const dueDate = new Date(invoice.dueDate);
  const isOverdue = invoice.status === "pending" && isPast(dueDate);

  const stopRecurrenceMutation = api.invoice.stopRecurrence.useMutation({
    onSuccess: () => {
      toast.success("Recurring payment stopped successfully");
      if (type === "sent") {
        utils.invoice.getAllIssuedByMe.invalidate();
      } else {
        utils.invoice.getAllIssuedToMe.invalidate();
      }
      setIsStopRecurrenceDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to stop recurring payment: ${error.message}`);
    },
  });

  const handleStopRecurrence = () => {
    stopRecurrenceMutation.mutate({
      requestId: invoice.requestId,
    });
  };

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        {children && <TableCell>{children}</TableCell>}
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span>{invoice.invoiceNumber}</span>
            {invoice.recurrence && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                ↻ {invoice.recurrence?.frequency?.toLowerCase()}
                {invoice.isRecurrenceStopped && (
                  <Badge variant="outline" className="ml-1 text-xs py-0 px-1">
                    Stopped
                  </Badge>
                )}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span>
              {type === "sent" ? invoice.clientName : invoice.creatorName}
            </span>
            <code className="text-xs text-muted-foreground">
              {type === "sent" ? invoice.clientEmail : invoice.creatorEmail}
            </code>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span>${Number(invoice.amount).toLocaleString()}</span>
            {invoice?.recurrence?.startDate && (
              <span className="text-xs text-muted-foreground">
                from{" "}
                {format(
                  new Date(invoice?.recurrence?.startDate),
                  "do MMM yyyy",
                )}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>{formatCurrencyLabel(invoice.invoiceCurrency)}</TableCell>
        <TableCell>{format(dueDate, "do MMM yyyy")}</TableCell>
        <TableCell>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block ${getInvoiceTableStatusClass(invoice.status, isOverdue)}`}
          >
            {getStatusDisplayText(invoice.status, isOverdue)}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Link
              href={`/invoices/${invoice.id}`}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card hover:bg-muted transition-colors"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">View</span>
            </Link>

            {invoice.recurrence &&
              !invoice.isRecurrenceStopped &&
              type === "sent" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsStopRecurrenceDialogOpen(true)}
                  disabled={stopRecurrenceMutation.isLoading}
                  className="h-8 w-8"
                >
                  <Ban className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">
                    {stopRecurrenceMutation.isLoading
                      ? "Stopping..."
                      : "Stop Recurring"}
                  </span>
                </Button>
              )}
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog
        open={isStopRecurrenceDialogOpen}
        onOpenChange={setIsStopRecurrenceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Recurring Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop this recurring payment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsStopRecurrenceDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStopRecurrence}
              disabled={stopRecurrenceMutation.isLoading}
            >
              {stopRecurrenceMutation.isLoading
                ? "Stopping..."
                : "Stop Recurring"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
