"use client";

import { ID_TO_APPKIT_NETWORK, NETWORK_TO_ID } from "@/lib/constants/chains";
import { handleBatchPayment } from "@/lib/invoice/batch-payment";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import { CreditCard, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceTabs } from "./invoice-tabs/invoice-tabs";
import { Button } from "./ui/button";

export function DashboardView() {
  const { mutateAsync: batchPay } = api.payment.batchPay.useMutation();

  const [selectedInvoices, setSelectedInvoices] = useState<Request[]>([]);
  const [lastSelectedNetwork, setLastSelectedNetwork] = useState<string | null>(
    null,
  );
  const [isPayingInvoices, setIsPayingInvoices] = useState(false);

  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId, switchNetwork } = useAppKitNetwork();

  const handleBatchPayInvoices = async () => {
    setIsPayingInvoices(true);

    if (!isConnected) {
      open();
      return setIsPayingInvoices(false);
    }

    if (!lastSelectedNetwork) {
      toast.error("No network selected for batch payment");
      setIsPayingInvoices(false);
      return;
    }

    const targetChain =
      NETWORK_TO_ID[lastSelectedNetwork as keyof typeof NETWORK_TO_ID];

    if (targetChain !== chainId) {
      const targetAppkitNetwork =
        ID_TO_APPKIT_NETWORK[targetChain as keyof typeof ID_TO_APPKIT_NETWORK];

      toast("Switching to network", {
        description: `Switching to ${targetAppkitNetwork.name} network`,
      });

      try {
        switchNetwork(targetAppkitNetwork);
      } catch (_) {
        toast("Error switching network");
        setIsPayingInvoices(false);
        return;
      }
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );

      const signer = await ethersProvider.getSigner();

      const requestIds = selectedInvoices.map((invoice) => invoice.requestId);

      const batchPaymentData = await batchPay({
        requestIds,
        payer: address,
      });

      const result = await handleBatchPayment({
        signer,
        batchPaymentData,
        onSuccess: () => {
          toast.success("Batch payment successful", {
            description: `Successfully processed ${selectedInvoices.length} invoices`,
          });
          setSelectedInvoices([]);
          setLastSelectedNetwork(null);
        },
        onError: () => {
          setIsPayingInvoices(false);
        },
        onStatusChange: (status) => {
          setIsPayingInvoices(status === "processing");
        },
      });

      if (!result.success) {
        console.error("Batch payment failed:", result.error);
      }
    } catch (error) {
      console.error("Failed to initiate batch payment:", error);
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
      <InvoiceTabs
        setSelectedInvoices={setSelectedInvoices}
        selectedInvoices={selectedInvoices}
        lastSelectedNetwork={lastSelectedNetwork}
        setLastSelectedNetwork={setLastSelectedNetwork}
      />
    </>
  );
}
