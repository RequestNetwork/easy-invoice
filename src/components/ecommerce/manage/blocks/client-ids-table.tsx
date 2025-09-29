"use client";

import { ShortAddress } from "@/components/short-address";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/table/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { TableHeadCell } from "@/components/ui/table/table-head-cell";
import type { ClientId } from "@/server/db/schema";
import { format } from "date-fns";
import { CreditCard, Filter } from "lucide-react";
import { useState } from "react";

interface ClientIdsTableProps {
  clientIds: ClientId[];
}

const ClientIdTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Created Date</TableHeadCell>
    <TableHeadCell>Label</TableHeadCell>
    <TableHeadCell>Domain</TableHeadCell>
    <TableHeadCell>Client ID</TableHeadCell>
    <TableHeadCell>Fee Address</TableHeadCell>
    <TableHeadCell>Fee Percentage</TableHeadCell>
  </TableRow>
);

const ClientIdRow = ({ clientId }: { clientId: ClientId }) => {
  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell>
        {clientId.createdAt
          ? format(new Date(clientId.createdAt), "do MMM yyyy")
          : "N/A"}
      </TableCell>
      <TableCell className="font-medium">{clientId.label}</TableCell>
      <TableCell>{clientId.domain}</TableCell>
      <TableCell>
        <ShortAddress address={clientId.clientId} />
      </TableCell>
      <TableCell>
        {clientId.feeAddress ? (
          <ShortAddress address={clientId.feeAddress} />
        ) : (
          <span className="text-zinc-500">-</span>
        )}
      </TableCell>
      <TableCell>
        {clientId.feePercentage ? (
          <span>{clientId.feePercentage}%</span>
        ) : (
          <span className="text-zinc-500">-</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export function ClientIdsTable({ clientIds }: ClientIdsTableProps) {
  const [activeClient, setActiveClient] = useState<string | null>(null);

  const filteredClientIds = activeClient
    ? clientIds.filter(({ clientId }) => clientId === activeClient)
    : clientIds;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-600" />
          <span className="text-sm font-medium text-zinc-700">
            Filter by client:
          </span>
        </div>
        <Select
          value={activeClient || "all"}
          onValueChange={(value) =>
            setActiveClient(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Client Ids" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clientIds.map(({ clientId, label }) => (
              <SelectItem key={clientId} value={clientId}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <ClientIdTableColumns />
            </TableHeader>
            <TableBody>
              {filteredClientIds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={<CreditCard className="h-6 w-6 text-zinc-600" />}
                      title="No client IDs"
                      subtitle={
                        activeClient
                          ? "No client IDs found for the selected client"
                          : "No client IDs found"
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientIds.map((clientId) => (
                  <ClientIdRow key={clientId.id} clientId={clientId} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
