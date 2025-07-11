"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { AlertCircle, DollarSign, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "./empty-state";
import { InvoiceRow } from "./invoice-row";
import { Pagination } from "./pagination";
import { StatCard } from "./stat-card";
import { TableHeadCell } from "./table-head-cell";

const ITEMS_PER_PAGE = 10;
const RETRIEVE_ALL_INVOICES_POLLING_INTERVAL = 3000;

interface InvoicesSentProps {
  setSelectedInvoices: (invoices: Request[]) => void;
  selectedInvoices: Request[];
  lastSelectedNetwork: string | null;
  setLastSelectedNetwork: (network: string | null) => void;
}

const TableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell className="w-[1%]">Select</TableHeadCell>
    <TableHeadCell>Invoice #</TableHeadCell>
    <TableHeadCell>Client</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Due Date</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
    <TableHeadCell className="w-[1%]">Actions</TableHeadCell>
  </TableRow>
);

export const InvoicesSent = ({
  setSelectedInvoices,
  selectedInvoices,
  lastSelectedNetwork,
  setLastSelectedNetwork,
}: InvoicesSentProps) => {
  const [page, setPage] = useState(1);

  const { data: invoiceData } = api.invoice.getAllIssuedByMe.useQuery(
    undefined,
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchInterval: RETRIEVE_ALL_INVOICES_POLLING_INTERVAL,
    },
  );

  const invoices = invoiceData?.issuedByMe.invoices || [];
  const total = invoiceData?.issuedByMe.total || 0;
  const outstanding = invoiceData?.issuedByMe.outstanding || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoices"
          value={invoices.length}
          icon={<FileText className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Outstanding Invoices"
          value={outstanding}
          icon={<AlertCircle className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Total Payments"
          value={`$${total.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
        />
      </div>

      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableColumns />
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={<FileText className="h-6 w-6 text-zinc-600" />}
                      title="No invoices yet"
                      subtitle="Create your first invoice to get paid"
                      callToAction={
                        <Link href="/invoices/create">
                          <Button className="bg-black hover:bg-zinc-800 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Invoice
                          </Button>
                        </Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                invoices
                  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                  .map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      type="sent"
                      setSelectedInvoices={setSelectedInvoices}
                      selectedInvoices={selectedInvoices}
                      lastSelectedNetwork={lastSelectedNetwork}
                      setLastSelectedNetwork={setLastSelectedNetwork}
                    />
                  ))
              )}
            </TableBody>
          </Table>
          {invoices.length > 0 && (
            <Pagination
              page={page}
              setPage={setPage}
              totalItems={invoices.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
