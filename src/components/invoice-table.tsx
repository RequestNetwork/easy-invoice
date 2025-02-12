"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyLabel } from "@/lib/currencies";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { format, isPast } from "date-fns";
import { Eye, FileText, PlusCircle } from "lucide-react";
import { AlertCircle, DollarSign } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";

const ITEMS_PER_PAGE = 10;

interface InvoiceTableProps {
  initialInvoices: {
    invoices: Request[];
    totalPayments: number;
    outstandingInvoices: number;
  };
}

export function InvoiceTable({ initialInvoices }: InvoiceTableProps) {
  const [page, setPage] = useState(1);

  const { data: invoices } = api.invoice.getAll.useQuery(undefined, {
    initialData: initialInvoices,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const totalPages = Math.ceil(invoices.invoices.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = invoices.invoices.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">
              {invoices.invoices.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Outstanding Invoices
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">
              {invoices.outstandingInvoices}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Total Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">
              ${invoices.totalPayments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {invoices.invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No invoices found
          </h3>
          <p className="text-gray-500">
            Get started by creating your first invoice.
          </p>
          <Link
            href="/invoices/create"
            className="inline-flex items-center mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 transition-colors"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </div>
      ) : (
        <Card className="flex-grow">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">
                Recent Invoices
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-t">
                  <TableHead className="text-gray-600">Invoice #</TableHead>
                  <TableHead className="text-gray-600">Client</TableHead>
                  <TableHead className="text-gray-600">Amount</TableHead>
                  <TableHead className="text-gray-600">Currency</TableHead>
                  <TableHead className="text-gray-600">Due Date</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => {
                  const dueDate = new Date(invoice.dueDate);
                  const isOverdue =
                    invoice.status === "pending" && isPast(dueDate);

                  return (
                    <TableRow key={invoice.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>
                        {Number(invoice.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {formatCurrencyLabel(invoice.invoiceCurrency)}
                      </TableCell>
                      <TableCell>{format(dueDate, "do MMMM yyyy")}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : isOverdue
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {isOverdue
                            ? "Overdue"
                            : invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
