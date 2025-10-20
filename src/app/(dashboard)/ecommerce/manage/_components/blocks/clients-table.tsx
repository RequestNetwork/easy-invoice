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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { TableHeadCell } from "@/components/ui/table/table-head-cell";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import type { EcommerceClient } from "@/server/db/schema";
import { format } from "date-fns";
import { CreditCard, Filter } from "lucide-react";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteEcommerceClient } from "./delete-client";
import { EditEcommerceClient } from "./edit-client";

interface EcommerceClientsTableProps {
  ecommerceClients: EcommerceClient[];
}

const EcommerceClientTableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Created Date</TableHeadCell>
    <TableHeadCell>Label</TableHeadCell>
    <TableHeadCell>Domain</TableHeadCell>
    <TableHeadCell>RN Client ID</TableHeadCell>
    <TableHeadCell>Fee Address</TableHeadCell>
    <TableHeadCell>Fee Percentage</TableHeadCell>
    <TableHeadCell className="text-right">Actions</TableHeadCell>
  </TableRow>
);

const EcommerceClientRow = ({
  ecommerceClient,
}: { ecommerceClient: EcommerceClient }) => {
  const canShowActions = ecommerceClient.domain !== DEFAULT_CLIENT_ID_DOMAIN;

  return (
    <TableRow className="hover:bg-zinc-50/50">
      <TableCell>
        {ecommerceClient.createdAt
          ? format(new Date(ecommerceClient.createdAt), "do MMM yyyy")
          : "N/A"}
      </TableCell>
      <TableCell className="font-medium">{ecommerceClient.label}</TableCell>
      <TableCell>{ecommerceClient.domain}</TableCell>
      <TableCell>
        <ShortAddress
          copyContent="Copy RN Client ID"
          address={ecommerceClient.rnClientId}
        />
      </TableCell>
      <TableCell>
        {ecommerceClient.feeAddress ? (
          <ShortAddress address={ecommerceClient.feeAddress} />
        ) : (
          <span className="text-zinc-500">-</span>
        )}
      </TableCell>
      <TableCell>
        {ecommerceClient.feePercentage ? (
          <span>{ecommerceClient.feePercentage}%</span>
        ) : (
          <span className="text-zinc-500">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {canShowActions && (
            <>
              <EditEcommerceClient ecommerceClient={ecommerceClient}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </EditEcommerceClient>
              <DeleteEcommerceClient ecommerceClient={ecommerceClient}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </DeleteEcommerceClient>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export function EcommerceClientsTable({
  ecommerceClients,
}: EcommerceClientsTableProps) {
  const [activeClient, setActiveClient] = useState<string | null>(null);

  const filteredEcommerceClients = activeClient
    ? ecommerceClients.filter(({ id }) => id === activeClient)
    : ecommerceClients;

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
            {ecommerceClients.map(({ id, label }) => (
              <SelectItem key={id} value={id}>
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
              <EcommerceClientTableColumns />
            </TableHeader>
            <TableBody>
              {filteredEcommerceClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
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
                filteredEcommerceClients.map((ecommerceClient) => (
                  <EcommerceClientRow
                    key={ecommerceClient.id}
                    ecommerceClient={ecommerceClient}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
