"use client";

import { handleBatchPayment } from "@/lib/invoice/batch-payment";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import { CreditCard, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceTable } from "./invoice-table";
import { Button } from "./ui/button";

interface DashboardViewProps {
  invoices: {
    issuedByMe: { invoices: Request[]; total: number; outstanding: number };
    issuedToMe: { invoices: Request[]; total: number; outstanding: number };
  };
}

export function DashboardView({ invoices }: DashboardViewProps) {
  const { mutateAsync: batchPay } = api.payment.batchPay.useMutation();

  const [selectedInvoices, setSelectedInvoices] = useState<Request[]>([]);
  const [lastSelectedNetwork, setLastSelectedNetwork] = useState<string | null>(
    null,
  );
  const [isPayingInvoices, setIsPayingInvoices] = useState(false);

  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const handleBatchPayInvoices = async () => {
    setIsPayingInvoices(true);

    if (!isConnected) {
      open();
      return setIsPayingInvoices(false);
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );

      const signer = await ethersProvider.getSigner();

      toast.info("Initiating batch payment...");

      const requestIds = selectedInvoices.map((invoice) => invoice.requestId);

      const batchPaymentData = await batchPay({
        requestIds,
        payer: address,
      });

      await handleBatchPayment({
        signer,
        batchPaymentData,
        invoicesCount: selectedInvoices.length,
      });

      setSelectedInvoices([]);
      setLastSelectedNetwork(null);
    } catch (_err) {
      toast.error("Payment failed", {
        description:
          "There was an error processing your payment. Please try again.",
      });
    } finally {
      setIsPayingInvoices(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 ">
          {selectedInvoices.length > 0 && (
            <Button
              variant="outline"
              className="px-4 py-2 rounded-md flex items-center"
              onClick={handleBatchPayInvoices}
              disabled={isPayingInvoices}
            >
              {isPayingInvoices ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {isPayingInvoices
                ? "Paying..."
                : `Pay ${selectedInvoices.length} ${
                    selectedInvoices.length === 1 ? "Invoice" : "Invoices"
                  }`}
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
