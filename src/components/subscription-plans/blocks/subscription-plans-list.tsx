"use client";

import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { CreateSubscriptionPlan } from "./create-subscription-plan";
import { SubscriptionPlanLink } from "./subscription-plan-link";

interface SubscriptionPlansProps {
  initialSubscriptionPlans: SubscriptionPlan[];
}

export function SubscriptionPlansList({
  initialSubscriptionPlans,
}: SubscriptionPlansProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: subscriptionPlans, isLoading } =
    api.subscriptionPlan.getAll.useQuery(undefined, {
      initialData: initialSubscriptionPlans,
      refetchOnMount: true,
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-40">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
        <span className="ml-2 text-zinc-600">
          Loading subscription plans...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="space-y-4 mb-6">
        {subscriptionPlans.length > 0 ? (
          subscriptionPlans.map((plan) => (
            <SubscriptionPlanLink key={plan.id} plan={plan} />
          ))
        ) : (
          <div className="text-center py-8 text-zinc-500 self-start w-fit">
            <p>No subscription plans yet</p>
            <p className="text-sm">Create your first plan to get started</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => setIsCreateModalOpen(true)}
        className="bg-black text-white hover:bg-zinc-800 rounded-md px-4 py-2 text-sm font-medium"
      >
        + New Plan
      </Button>

      {isCreateModalOpen && (
        <CreateSubscriptionPlan onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
