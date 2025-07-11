"use client";

import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreateSubscriptionPlan } from "./blocks/create-subscription-plan";
import { SubscriptionPlanLink } from "./blocks/subscription-plan-link";

interface SubscriptionPlansProps {
  initialSubscriptionPlans: SubscriptionPlan[];
}

export function SubscriptionPlans({
  initialSubscriptionPlans,
}: SubscriptionPlansProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: subscriptionPlans } = api.subscriptionPlan.getAll.useQuery(
    undefined,
    {
      initialData: initialSubscriptionPlans,
      refetchOnMount: true,
    },
  );

  return (
    <main className="flex-grow flex flex-col max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 gap-8">
        <div className="flex items-center ">
          <Link
            href="/dashboard"
            className="text-zinc-600 hover:text-black transition-colors mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Subscription Plans
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white hover:bg-zinc-800 rounded-md px-4 py-2 text-sm font-medium"
        >
          + New Plan
        </Button>
      </div>

      <div className="space-y-4">
        {subscriptionPlans.map((plan) => (
          <SubscriptionPlanLink key={plan.id} plan={plan} />
        ))}
      </div>
      {isCreateModalOpen && (
        <CreateSubscriptionPlan onClose={() => setIsCreateModalOpen(false)} />
      )}
    </main>
  );
}
