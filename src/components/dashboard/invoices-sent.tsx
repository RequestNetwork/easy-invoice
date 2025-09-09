"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  calculateTotalsByCurrency,
  formatCurrencyTotals,
} from "@/lib/helpers/currency";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { AUTH_CONNECTION, WALLET_CONNECTORS } from "@web3auth/modal";
import { useWeb3AuthConnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { AlertCircle, DollarSign, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MultiCurrencyStatCard } from "../multi-currency-stat-card";
import { StatCard } from "../stat-card";
import { EmptyState } from "../ui/table/empty-state";
import { Pagination } from "../ui/table/pagination";
import { TableHeadCell } from "../ui/table/table-head-cell";
import { InvoiceRow } from "./blocks/invoice-row";

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
  session: any;
}

export const InvoicesSent = ({
  initialSentInvoices,
  session,
}: InvoicesSentProps) => {
  const [page, setPage] = useState(1);

  const { connectTo, isConnected, loading: isLoading } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();

  const { data: invoices } = api.invoice.getAllIssuedByMe.useQuery(undefined, {
    initialData: initialSentInvoices,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: RETRIEVE_ALL_INVOICES_POLLING_INTERVAL,
  });

  const invoiceItems =
    invoices?.map((invoice) => ({
      amount: invoice.amount,
      currency: invoice.paymentCurrency,
    })) || [];

  const totalsByCurrency = calculateTotalsByCurrency(invoiceItems);
  const totalValues = formatCurrencyTotals(totalsByCurrency);

  const outstanding =
    invoices?.filter((inv) => inv.status !== "paid").length || 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p>Loading...</p>
      ) : !isConnected || !userInfo ? (
        <Button
          onClick={async () => {
            await connectTo(WALLET_CONNECTORS.AUTH, {
              authConnectionId: "rn-google-jwt-verifier",
              authConnection: AUTH_CONNECTION.CUSTOM,
              idToken: session.idToken as string,
            });
          }}
        >
          Connect to google
        </Button>
      ) : (
        <>
          {/*<h2>Connected to {connector?.name}</h2>
          <div>{address}</div>*/}
          <p>{JSON.stringify(userInfo)}</p>
        </>
      )}

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
        <MultiCurrencyStatCard
          title="Total Payments"
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
          values={totalValues}
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
