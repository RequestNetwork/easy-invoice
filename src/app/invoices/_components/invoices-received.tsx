"use client";

import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { NETWORK_TO_ID } from "@/lib/constants/chains";
import { handleBatchPayment } from "@/lib/helpers/batch-payment";
import {
  calculateTotalsByCurrency,
  formatCurrencyTotals,
} from "@/lib/helpers/currency";
import { useSwitchNetwork } from "@/lib/hooks/use-switch-network";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import { AlertCircle, DollarSign, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MultiCurrencyStatCard } from "../../../components/multi-currency-stat-card";
import { InvoiceRow } from "./invoice-row";

const ITEMS_PER_PAGE = 10;
const RETRIEVE_ALL_INVOICES_POLLING_INTERVAL = 3000;

const TableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell className="text-muted-foreground font-medium w-[1%]">
      Select
    </TableHeadCell>
    <TableHeadCell>Invoice #</TableHeadCell>
    <TableHeadCell>From</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Due Date</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
    <TableHeadCell className="text-muted-foreground font-medium w-[1%]">
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
  const { switchToChainId } = useSwitchNetwork();

  const { data: invoices } = api.invoice.getAllIssuedToMe.useQuery(undefined, {
    initialData: initialReceivedInvoices,
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

    try {
      const targetChainId =
        NETWORK_TO_ID[lastSelectedNetwork as keyof typeof NETWORK_TO_ID];

      await switchToChainId(targetChainId);

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
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {selectedInvoices.length} invoice
                {selectedInvoices.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-muted-foreground">
                Total: $
                {selectedInvoices
                  .reduce((sum, invoice) => sum + Number(invoice.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <Button
              onClick={handleBatchPayInvoices}
              disabled={isPayingInvoices}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
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
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Outstanding Invoices"
          value={outstanding}
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <MultiCurrencyStatCard
          title="Total Due"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          values={totalValues}
        />
      </div>

      <Card className="border border-border">
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
                      icon={
                        <DollarSign className="h-6 w-6 text-muted-foreground" />
                      }
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
