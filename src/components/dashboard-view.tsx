"use client";

import type { Request } from "@/server/db/schema";
import { CreditCard, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { InvoiceTable } from "./invoice-table";
import { Button } from "./ui/button";

interface DashboardViewProps {
  invoices: {
    issuedByMe: { invoices: Request[]; total: number; outstanding: number };
    issuedToMe: { invoices: Request[]; total: number; outstanding: number };
  };
}

export function DashboardView({ invoices }: DashboardViewProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<Request[]>([]);
  const [lastSelectedNetwork, setLastSelectedNetwork] = useState<string | null>(
    null,
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 ">
          {selectedInvoices.length > 0 && (
            <Button
              variant="outline"
              className="px-4 py-2 rounded-md flex items-center"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {selectedInvoices.length} invoices
            </Button>
          )}
          <Link
            href="/invoices/create"
            className="bg-black hover:bg-zinc-800 text-white transition-colors px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </div>
      </div>
      <InvoiceTable
        initialInvoices={invoices}
        setSelectedInvoices={setSelectedInvoices}
        selectedInvoices={selectedInvoices}
        lastSelectedNetwork={lastSelectedNetwork}
        setLastSelectedNetwork={setLastSelectedNetwork}
      />
    </>
  );
}
