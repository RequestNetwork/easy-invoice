"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function DashboardNavigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(() =>
    pathname.includes("/subscriptions") ? "subscriptions" : "receipts",
  );

  useEffect(() => {
    if (pathname.includes("/subscriptions")) {
      setActiveTab("subscriptions");
    } else {
      setActiveTab("receipts");
    }
  }, [pathname]);

  return (
    <Tabs value={activeTab} className="w-full mb-8">
      <TabsList className="grid w-full grid-cols-2">
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
