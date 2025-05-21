"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import {
  getInvoiceTableStatusClass,
  getStatusDisplayText,
} from "@/lib/invoice-status";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { format, isPast } from "date-fns";
import {
  AlertCircle,
  Ban,
  DollarSign,
  Eye,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

const ITEMS_PER_PAGE = 10;

type InvoiceType = {
  invoices: Request[];
  total: number;
  outstanding: number;
};

interface InvoiceTableProps {
  initialInvoices: {
    issuedByMe: InvoiceType;
    issuedToMe: InvoiceType;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <Card className="bg-white border border-zinc-100">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-zinc-600">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function InvoiceTable({ initialInvoices }: InvoiceTableProps) {
  const [receivablePage, setReceivablePage] = useState(1);
  const [payablePage, setPayablePage] = useState(1);
  const [activeTab, setActiveTab] = useState("sent");

  const { data: invoices } = api.invoice.getAll.useQuery(undefined, {
    initialData: initialInvoices,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const activeData =
    activeTab === "sent" ? invoices.issuedByMe : invoices.issuedToMe;

  const EmptyState = ({ type }: { type: "sent" | "received" }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        {type === "sent" ? (
          <FileText className="h-6 w-6 text-zinc-600" />
        ) : (
          <DollarSign className="h-6 w-6 text-zinc-600" />
        )}
      </div>
      <h3 className="text-lg font-medium text-zinc-900 mb-1">
        {type === "sent" ? "No invoices yet" : "No invoices to pay"}
      </h3>
      <p className="text-sm text-zinc-500 text-center mb-4">
        {type === "sent"
          ? "Create your first invoice to get paid"
          : "When someone creates an invoice for you, it will appear here"}
      </p>
      {type === "sent" && (
        <Link href="/invoices/create">
          <Button className="bg-black hover:bg-zinc-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoices"
          value={activeData.invoices.length}
          icon={<FileText className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Outstanding Invoices"
          value={activeData.outstanding}
          icon={<AlertCircle className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title={activeTab === "sent" ? "Total Payments" : "Total Due"}
          value={`$${activeData.total.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sent" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="sent" className="flex-1">
            Get paid
          </TabsTrigger>
          <TabsTrigger value="received" className="flex-1">
            Pay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent">
          <Card className="border border-zinc-100">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableColumns type="sent" />
                </TableHeader>
                <TableBody>
                  {activeData.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState type="sent" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeData.invoices
                      .slice(
                        (receivablePage - 1) * ITEMS_PER_PAGE,
                        receivablePage * ITEMS_PER_PAGE,
                      )
                      .map((invoice) => (
                        <InvoiceRow
                          key={invoice.id}
                          invoice={invoice}
                          activeTab="sent"
                        />
                      ))
                  )}
                </TableBody>
              </Table>
              {activeData.invoices.length > 0 && (
                <Pagination
                  page={receivablePage}
                  setPage={setReceivablePage}
                  totalItems={activeData.invoices.length}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card className="border border-zinc-100">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableColumns type="received" />
                </TableHeader>
                <TableBody>
                  {activeData.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState type="received" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeData.invoices
                      .slice(
                        (payablePage - 1) * ITEMS_PER_PAGE,
                        payablePage * ITEMS_PER_PAGE,
                      )
                      .map((invoice) => (
                        <InvoiceRow
                          key={invoice.id}
                          invoice={invoice}
                          activeTab="received"
                        />
                      ))
                  )}
                </TableBody>
              </Table>
              {activeData.invoices.length > 0 && (
                <Pagination
                  page={payablePage}
                  setPage={setPayablePage}
                  totalItems={activeData.invoices.length}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Extracted components for better organization
const InvoiceRow = ({
  invoice,
  activeTab,
}: { invoice: Request; activeTab: "sent" | "received" }) => {
  const utils = api.useUtils();
  const dueDate = new Date(invoice.dueDate);
  const isOverdue = invoice.status === "pending" && isPast(dueDate);

  const stopRecurrenceMutation = api.invoice.stopRecurrence.useMutation({
    onSuccess: () => {
      toast.success("Recurring payment stopped successfully");
      // Refresh the invoice list
      utils.invoice.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to stop recurring payment: ${error.message}`);
    },
  });

  // Function to handle stopping recurrence
  const handleStopRecurrence = () => {
    if (confirm("Are you sure you want to stop this recurring payment?")) {
      stopRecurrenceMutation.mutate({
        requestId: invoice.requestId,
      });
    }
  };

  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{invoice.invoiceNumber}</span>
          {invoice.recurrence && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
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
            {activeTab === "sent" ? invoice.clientName : invoice.creatorName}
          </span>
          <code className="text-xs text-zinc-500">
            {activeTab === "sent" ? invoice.clientEmail : invoice.creatorEmail}
          </code>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>${Number(invoice.amount).toLocaleString()}</span>
          {invoice?.recurrence?.startDate && (
            <span className="text-xs text-zinc-500">
              from{" "}
              {format(new Date(invoice?.recurrence?.startDate), "do MMM yyyy")}
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
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
          >
            <Eye className="h-4 w-4 text-zinc-600" />
            <span className="sr-only">View</span>
          </Link>

          {invoice.recurrence &&
            !invoice.isRecurrenceStopped &&
            activeTab === "sent" && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleStopRecurrence}
                disabled={stopRecurrenceMutation.isLoading}
                className="h-8 w-8"
              >
                <Ban className="h-4 w-4 text-zinc-600" />
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
  );
};

// Update the table headers based on tab
const TableColumns = ({ type }: { type: "sent" | "received" }) => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHead className="text-zinc-500 font-medium">Invoice #</TableHead>
    <TableHead className="text-zinc-500 font-medium">
      {type === "sent" ? "Client" : "From"}
    </TableHead>
    <TableHead className="text-zinc-500 font-medium">Amount</TableHead>
    <TableHead className="text-zinc-500 font-medium">Currency</TableHead>
    <TableHead className="text-zinc-500 font-medium">Due Date</TableHead>
    <TableHead className="text-zinc-500 font-medium">Status</TableHead>
    <TableHead className="text-zinc-500 font-medium w-[1%]">Actions</TableHead>
  </TableRow>
);

const Pagination = ({
  page,
  setPage,
  totalItems,
}: {
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Don't show pagination if there are no items
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-100">
      <Button
        variant="outline"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="text-sm"
      >
        Previous
      </Button>
      <span className="text-sm text-zinc-600">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="text-sm"
      >
        Next
      </Button>
    </div>
  );
};
