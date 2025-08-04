"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function PayoutNavigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("single");

  useEffect(() => {
    if (pathname.includes("/batch")) {
      setActiveTab("batch");
    } else if (pathname.includes("/recurring")) {
      setActiveTab("recurring");
    } else {
      setActiveTab("single");
    }
  }, [pathname]);

  return (
    <Tabs value={activeTab} className="w-full mb-8">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="single" asChild>
          <Link href="/payouts/single">Single Payout</Link>
        </TabsTrigger>
        <TabsTrigger value="batch" asChild>
          <Link href="/payouts/batch">Batch Payout</Link>
        </TabsTrigger>
        <TabsTrigger value="recurring" asChild>
          <Link href="/payouts/recurring">Recurring Payouts</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
