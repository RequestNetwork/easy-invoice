"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateRecurringPayment } from "./create-recurring-payment";
import { ViewRecurringPayments } from "./view-recurring-payments";

export function RecurringPayments() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    if (pathname.includes("/create")) {
      setActiveTab("create");
    } else {
      setActiveTab("view");
    }
  }, [pathname]);

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="view" asChild>
          <Link href="/payouts/recurring">View Payments</Link>
        </TabsTrigger>
        <TabsTrigger value="create" asChild>
          <Link href="/payouts/recurring/create">Create New</Link>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="view">
        <ViewRecurringPayments />
      </TabsContent>

      <TabsContent value="create">
        <CreateRecurringPayment />
      </TabsContent>
    </Tabs>
  );
}
