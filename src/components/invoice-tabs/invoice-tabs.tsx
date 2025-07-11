"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Request } from "@/server/db/schema";
import { InvoicesReceived } from "./blocks/invoices-received";
import { InvoicesSent } from "./blocks/invoices-sent";
import { SubscriptionsTable } from "./blocks/subscriptions-table";

interface InvoiceTabsProps {
  setSelectedInvoices: (invoices: Request[]) => void;
  selectedInvoices: Request[];
  lastSelectedNetwork: string | null;
  setLastSelectedNetwork: (network: string | null) => void;
}

export function InvoiceTabs({
  setSelectedInvoices,
  selectedInvoices,
  lastSelectedNetwork,
  setLastSelectedNetwork,
}: InvoiceTabsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="sent" className="flex-1 min-w-0 w-32">
            Get paid
          </TabsTrigger>
          <TabsTrigger value="received" className="flex-1 min-w-0 w-32">
            Pay
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex-1 min-w-0 w-32">
            Subscriptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent">
          <InvoicesSent
            setSelectedInvoices={setSelectedInvoices}
            selectedInvoices={selectedInvoices}
            lastSelectedNetwork={lastSelectedNetwork}
            setLastSelectedNetwork={setLastSelectedNetwork}
          />
        </TabsContent>

        <TabsContent value="received">
          <InvoicesReceived
            setSelectedInvoices={setSelectedInvoices}
            selectedInvoices={selectedInvoices}
            lastSelectedNetwork={lastSelectedNetwork}
            setLastSelectedNetwork={setLastSelectedNetwork}
          />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
