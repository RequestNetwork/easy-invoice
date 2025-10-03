"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/table/empty-state";
import { Pagination } from "@/components/ui/table/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { TableHeadCell } from "@/components/ui/table/table-head-cell";
import type { ClientPaymentWithEcommerceClient } from "@/lib/types";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { Filter, Receipt } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "../ui/table/error-state";

interface DashboardReceiptsProps {
  initialClientPayments: ClientPaymentWithEcommerceClient[];
}

const ReceiptTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Date</TableHeadCell>
    <TableHeadCell>Reference</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Payment Currency</TableHeadCell>
    <TableHeadCell>Network</TableHeadCell>
    <TableHeadCell>Merchant</TableHeadCell>
  </TableRow>
);

const ReceiptRow = ({
  receipt,
}: { receipt: ClientPaymentWithEcommerceClient }) => {
  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell>
        {receipt.createdAt
          ? format(new Date(receipt.createdAt), "do MMM yyyy")
          : "N/A"}
      </TableCell>
      <TableCell>
        {receipt.reference || <span className="text-zinc-500">-</span>}
      </TableCell>
      <TableCell className="font-medium">{receipt.amount}</TableCell>
      <TableCell>{receipt.paymentCurrency}</TableCell>
      <TableCell>{receipt.network}</TableCell>
      <TableCell>{receipt.ecommerceClient.label}</TableCell>
    </TableRow>
  );
};

const ITEMS_PER_PAGE = 10;

export function DashboardReceipts({
  initialClientPayments,
}: DashboardReceiptsProps) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, error, refetch, isRefetching } =
    api.ecommerce.getAllUserReceipts.useQuery(undefined, {
      initialData: initialClientPayments,
      refetchOnMount: true,
    });

  if (error) {
    return (
      <ErrorState
        onRetry={refetch}
        isRetrying={isRefetching}
        explanation="We couldn't load the receipts data. Please try again."
      />
    );
  }

  const receipts = data || [];

  const filteredReceipts = activeClientId
    ? receipts.filter((receipt) => receipt.ecommerceClientId === activeClientId)
    : receipts;

  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleClientFilterChange = (value: string) => {
    setActiveClientId(value === "all" ? null : value);
    setCurrentPage(1);
  };

  const ecommerceClients = receipts.reduce(
    (acc, receipt) => {
      if (acc[receipt.ecommerceClient.id]) return acc;
      acc[receipt.ecommerceClient.id] = receipt.ecommerceClient;
      return acc;
    },
    {} as Record<string, ClientPaymentWithEcommerceClient["ecommerceClient"]>,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        View all your payment receipts from ecommerce transactions
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-600" />
            <span className="text-sm font-medium text-zinc-700">
              Filter by merchant:
            </span>
          </div>
          <Select
            value={activeClientId || "all"}
            onValueChange={handleClientFilterChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Merchants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Merchants</SelectItem>
              {Object.entries(ecommerceClients).map(([clientId, client]) => (
                <SelectItem key={clientId} value={clientId}>
                  {client.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <ReceiptTableColumns />
            </TableHeader>
            <TableBody>
              {paginatedReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={<Receipt className="h-6 w-6 text-zinc-600" />}
                      title="No receipts"
                      subtitle={
                        activeClientId
                          ? "No receipts found for the selected merchant"
                          : "You haven't received any payments yet"
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReceipts.map((receipt) => (
                  <ReceiptRow key={receipt.id} receipt={receipt} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          totalItems={filteredReceipts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          setPage={setCurrentPage}
        />
      )}
    </div>
  );
}
