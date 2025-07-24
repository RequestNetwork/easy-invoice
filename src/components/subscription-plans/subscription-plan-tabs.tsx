"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubscriptionPlanTabsProps {
  plansTab: React.ReactNode;
  subscribersTab: React.ReactNode;
  paymentsTab: React.ReactNode;
}

export function SubscriptionPlanTabs({
  plansTab,
  subscribersTab,
  paymentsTab,
}: SubscriptionPlanTabsProps) {
  return (
    <Tabs defaultValue="plans" className="w-full">
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
