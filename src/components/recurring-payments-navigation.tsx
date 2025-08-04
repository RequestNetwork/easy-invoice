"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function RecurringPaymentsNavigation() {
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
    <Tabs value={activeTab} className="w-fit">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger className="mx-0" value="view" asChild>
          <Link href="/payouts/recurring">View Payouts</Link>
        </TabsTrigger>
        <TabsTrigger value="create" asChild>
          <Link href="/payouts/recurring/create">Create New</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
