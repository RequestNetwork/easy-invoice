"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function DashboardNavigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("get-paid");

  useEffect(() => {
    if (pathname.includes("/pay")) {
      setActiveTab("pay");
    } else if (pathname.includes("/subscriptions")) {
      setActiveTab("subscriptions");
    } else if (pathname.includes("/receipts")) {
      setActiveTab("receipts");
    } else {
      setActiveTab("get-paid");
    }
  }, [pathname]);

  return (
    <Tabs value={activeTab} className="w-full mb-8">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="get-paid" asChild>
          <Link href="/dashboard/get-paid">Get Paid</Link>
        </TabsTrigger>
        <TabsTrigger value="pay" asChild>
          <Link href="/dashboard/pay">Pay</Link>
        </TabsTrigger>
        <TabsTrigger value="subscriptions" asChild>
          <Link href="/dashboard/subscriptions">Subscriptions</Link>
        </TabsTrigger>
        <TabsTrigger value="receipts" asChild>
          <Link href="/dashboard/receipts">Receipts</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
