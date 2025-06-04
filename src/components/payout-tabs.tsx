"use client";

import { BatchPayout } from "@/components/batch-payout";
import { DirectPayment } from "@/components/direct-payout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function PayoutTabs() {
  const [activeTab, setActiveTab] = useState("single");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="single">Single Payout</TabsTrigger>
        <TabsTrigger value="batch">Batch Payout</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        <DirectPayment />
      </TabsContent>

      <TabsContent value="batch">
        <BatchPayout />
      </TabsContent>
    </Tabs>
  );
}
