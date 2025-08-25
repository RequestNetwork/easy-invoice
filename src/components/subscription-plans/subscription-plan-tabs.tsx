"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SubscriptionPlanTabsProps {
  plansTab: React.ReactNode;
  subscribersTab: React.ReactNode;
  paymentsTab: React.ReactNode;
}

type TabValue = "plans" | "subscribers" | "payments";

const updateLinkHash = (value: string) => {
  const url = new URL(window.location.href);
  url.hash = value;
  window.history.replaceState({}, "", url.toString());
};

export function SubscriptionPlanTabs({
  plansTab,
  subscribersTab,
  paymentsTab,
}: SubscriptionPlanTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("plans");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const hash = window.location.hash.slice(1);
    let initialTab: TabValue = "plans";

    if (hash === "plans" || hash === "subscribers" || hash === "payments") {
      initialTab = hash;
    }

    setActiveTab(initialTab);
    updateLinkHash(initialTab);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center w-full h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue;
    setActiveTab(tabValue);
    updateLinkHash(tabValue);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
      </TabsList>

      <TabsContent value="plans" className="mt-6">
        {plansTab}
      </TabsContent>

      <TabsContent value="subscribers" className="mt-6">
        {subscribersTab}
      </TabsContent>

      <TabsContent value="payments" className="mt-6">
        {paymentsTab}
      </TabsContent>
    </Tabs>
  );
}
