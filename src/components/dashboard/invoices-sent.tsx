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
import { EmptyState } from "./blocks/empty-state";
import { InvoiceRow } from "./blocks/invoice-row";
import { Pagination } from "./blocks/pagination";
import { StatCard } from "./blocks/stat-card";
import { TableHeadCell } from "./blocks/table-head-cell";

const ITEMS_PER_PAGE = 10;
const RETRIEVE_ALL_INVOICES_POLLING_INTERVAL = 3000;

const TableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Invoice #</TableHeadCell>
    <TableHeadCell>Client</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Due Date</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
    <TableHeadCell className="w-[1%]">Actions</TableHeadCell>
  </TableRow>
);

interface InvoicesSentProps {
  initialSentInvoices: Request[];
}

export const InvoicesSent = ({ initialSentInvoices }: InvoicesSentProps) => {
  const [page, setPage] = useState(1);

  const { data: invoices } = api.invoice.getAllIssuedByMe.useQuery(undefined, {
    initialData: initialSentInvoices,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: RETRIEVE_ALL_INVOICES_POLLING_INTERVAL,
  });

  const total =
    invoices?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;
  const outstanding =
    invoices?.filter((inv) => inv.status !== "paid").length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoices"
          value={invoices?.length || 0}
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
              {!invoices || invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
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
                    />
                  ))
              )}
            </TableBody>
          </Table>
          {invoices && invoices.length > 0 && (
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
