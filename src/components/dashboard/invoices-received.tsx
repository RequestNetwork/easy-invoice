"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { AlertCircle, DollarSign, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "./blocks/empty-state";
import { InvoiceRow } from "./blocks/invoice-row";
import { Pagination } from "./blocks/pagination";
import { StatCard } from "./blocks/stat-card";
import { TableHeadCell } from "./blocks/table-head-cell";

const ITEMS_PER_PAGE = 10;
const RETRIEVE_ALL_INVOICES_POLLING_INTERVAL = 3000;

const TableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell className="text-zinc-500 font-medium w-[1%]">
      Select
    </TableHeadCell>
    <TableHeadCell>Invoice #</TableHeadCell>
    <TableHeadCell>From</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Due Date</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
    <TableHeadCell className="text-zinc-500 font-medium w-[1%]">
      Actions
    </TableHeadCell>
  </TableRow>
);

interface InvoicesReceivedProps {
  initialReceivedInvoices: Request[];
}

export const InvoicesReceived = ({
  initialReceivedInvoices,
}: InvoicesReceivedProps) => {
  const [page, setPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<Request[]>([]);
  const [lastSelectedNetwork, setLastSelectedNetwork] = useState<string | null>(
    null,
  );
  const [isPayingInvoices, setIsPayingInvoices] = useState(false);

  const { mutateAsync: batchPay } = api.payment.batchPay.useMutation();
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId, switchNetwork } = useAppKitNetwork();

  const { data: invoices } = api.invoice.getAllIssuedToMe.useQuery(undefined, {
    initialData: initialReceivedInvoices,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: RETRIEVE_ALL_INVOICES_POLLING_INTERVAL,
  });

  const total =
    invoices?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;
  const outstanding =
    invoices?.filter((inv) => inv.status !== "paid").length || 0;

  const handleSelectInvoice = (invoice: Request, isChecked: boolean) => {
    if (isChecked) {
      const invoiceNetwork = invoice.paymentCurrency.split("-")[1];
      if (lastSelectedNetwork && invoiceNetwork !== lastSelectedNetwork) {
        toast.error(
          "You can only select invoices from the same network as the last selected invoice",
        );
        return false;
      }

      if (invoice.status === "paid") {
        toast.error("You can't select a paid invoice");
        return false;
      }

      setSelectedInvoices([...selectedInvoices, invoice]);
      setLastSelectedNetwork(invoiceNetwork);
    } else {
      setSelectedInvoices(selectedInvoices.filter((i) => i.id !== invoice.id));
      if (selectedInvoices.length === 1) {
        setLastSelectedNetwork(null);
      }
    }

    return true;
  };

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
    <div className="space-y-6">
      {selectedInvoices.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {selectedInvoices.length} invoice
                {selectedInvoices.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-zinc-600">
                Total: $
                {selectedInvoices
                  .reduce((sum, invoice) => sum + Number(invoice.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <Button
              onClick={handleBatchPayInvoices}
              disabled={isPayingInvoices}
              className="bg-black hover:bg-zinc-800 text-white"
            >
              {isPayingInvoices ? "Paying..." : "Pay Selected"}
            </Button>
          </div>
        </div>
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
        <StatCard
          title="Total Due"
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
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={<DollarSign className="h-6 w-6 text-zinc-600" />}
                      title="No invoices to pay"
                      subtitle="When someone creates an invoice for you, it will appear here"
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
                      type="received"
                    >
                      <Checkbox
                        onCheckedChange={(checked) =>
                          handleSelectInvoice(invoice, checked as boolean)
                        }
                        checked={selectedInvoices.some(
                          (i) => i.id === invoice.id,
                        )}
                      />
                    </InvoiceRow>
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
