"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Request } from "@/server/db/schema";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InvoicesReceived } from "./invoices-received";
import { InvoicesSent } from "./invoices-sent";

interface InvoicesTabsProps {
  initialSentInvoices: Request[];
  initialReceivedInvoices: Request[];
}

export function InvoicesTabs({
  initialSentInvoices,
  initialReceivedInvoices,
}: InvoicesTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sent");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "received" || hash === "sent") {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/invoices#${value}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="sent">Outgoing Invoices</TabsTrigger>
        <TabsTrigger value="received">Incoming Bills</TabsTrigger>
      </TabsList>

      <TabsContent value="sent" className="mt-6">
        <InvoicesSent initialSentInvoices={initialSentInvoices} />
      </TabsContent>

      <TabsContent value="received" className="mt-6">
        <InvoicesReceived initialReceivedInvoices={initialReceivedInvoices} />
      </TabsContent>
    </Tabs>
  );
}
