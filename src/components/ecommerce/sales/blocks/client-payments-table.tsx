"use client";

import { ShortAddress } from "@/components/short-address";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useState } from "react";

interface ClientPaymentsTableProps {
  clientPayments: ClientPaymentWithEcommerceClient[];
}

interface CustomerInfoDisplayProps {
  customerInfo: ClientPaymentWithEcommerceClient["customerInfo"];
}

function CustomerInfoDisplay({ customerInfo }: CustomerInfoDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!customerInfo) {
    return <span className="text-zinc-500">-</span>;
  }

  const hasExpandableInfo =
    customerInfo.firstName || customerInfo.lastName || customerInfo.address;

  return (
    <div className="space-y-2">
      <div className="text-sm">{customerInfo.email || "No email"}</div>
      {hasExpandableInfo && (
        <>
          {isExpanded && (
            <div className="space-y-1 text-xs text-zinc-600 font-normal">
              {(customerInfo.firstName || customerInfo.lastName) && (
                <div>
                  {customerInfo.firstName} {customerInfo.lastName}
                </div>
              )}
              {customerInfo.address && (
                <div className="space-y-1">
                  {customerInfo.address.street && (
                    <div>{customerInfo.address.street}</div>
                  )}
                  <div>
                    {customerInfo.address.city}, {customerInfo.address.state}{" "}
                    {customerInfo.address.postalCode}
                  </div>
                  {customerInfo.address.country && (
                    <div>{customerInfo.address.country}</div>
                  )}
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
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
                Show details
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}

const ClientPaymentTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Date</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Network</TableHeadCell>
    <TableHeadCell>Invoice Currency</TableHeadCell>
    <TableHeadCell>Payment Currency</TableHeadCell>
    <TableHeadCell>Customer Info</TableHeadCell>
    <TableHeadCell>Reference</TableHeadCell>
    <TableHeadCell>Client</TableHeadCell>
    <TableHeadCell>Origin</TableHeadCell>
    <TableHeadCell>Request Scan URL</TableHeadCell>
  </TableRow>
);

const ClientPaymentRow = ({
  clientPayment,
}: { clientPayment: ClientPaymentWithEcommerceClient }) => {
  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell>
        {clientPayment.createdAt
          ? format(new Date(clientPayment.createdAt), "do MMM yyyy HH:mm")
          : "N/A"}
      </TableCell>
      <TableCell className="font-medium">{clientPayment.amount}</TableCell>
      <TableCell>{clientPayment.network}</TableCell>
      <TableCell>{clientPayment.invoiceCurrency}</TableCell>
      <TableCell>{clientPayment.paymentCurrency}</TableCell>
      <TableCell>
        <CustomerInfoDisplay customerInfo={clientPayment.customerInfo} />
      </TableCell>
      <TableCell>
        {clientPayment.reference || <span className="text-zinc-500">-</span>}
      </TableCell>
      <TableCell className="flex flex-col items-start gap-1 self-center">
        <span>{clientPayment.ecommerceClient.label}</span>
        <ShortAddress address={clientPayment.ecommerceClient.rnClientId} />
      </TableCell>
      <TableCell>
        {clientPayment.origin || <span className="text-zinc-500">-</span>}
      </TableCell>
      <TableCell>
        <a
          href={`https://scan.request.network/request/${clientPayment.requestId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="text-sm">View Request</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </TableCell>
    </TableRow>
  );
};

const ITEMS_PER_PAGE = 10;
export function ClientPaymentsTable({
  clientPayments,
}: ClientPaymentsTableProps) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPayments = activeClientId
    ? clientPayments.filter(
        (payment) => payment.ecommerceClientId === activeClientId,
      )
    : clientPayments;

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleClientFilterChange = (value: string) => {
    setActiveClientId(value === "all" ? null : value);
    setCurrentPage(1);
  };

  const ecommerceClients = clientPayments.reduce(
    (acc, payment) => {
      if (acc[payment.ecommerceClient.id]) return acc;
      acc[payment.ecommerceClient.id] = payment.ecommerceClient;
      return acc;
    },
    {} as Record<string, ClientPaymentWithEcommerceClient["ecommerceClient"]>,
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-600" />
            <span className="text-sm font-medium text-zinc-700">
              Filter by client:
            </span>
          </div>
          <Select
            value={activeClientId || "all"}
            onValueChange={handleClientFilterChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
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
              <ClientPaymentTableColumns />
            </TableHeader>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState
                      icon={<CreditCard className="h-6 w-6 text-zinc-600" />}
                      title="No client payments"
                      subtitle={
                        activeClientId
                          ? "No payments found for the selected client"
                          : "No payments received yet"
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((clientPayment) => (
                  <ClientPaymentRow
                    key={clientPayment.id}
                    clientPayment={clientPayment}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          totalItems={filteredPayments.length}
          itemsPerPage={ITEMS_PER_PAGE}
          setPage={setCurrentPage}
        />
      )}
    </div>
  );
}
