"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function EcommerceNavigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("manage");

  useEffect(() => {
    if (pathname.includes("/sales")) {
      setActiveTab("sales");
    } else {
      setActiveTab("manage");
    }
  }, [pathname]);

  return (
    <Tabs value={activeTab} className="w-full mb-8">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="manage" asChild>
          <Link href="/ecommerce/manage">Manage</Link>
        </TabsTrigger>
        <TabsTrigger value="sales" asChild>
          <Link href="/ecommerce/sales">Sales</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
