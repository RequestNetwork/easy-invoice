"use client";

import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
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

  const { data: subscriptionPlans } = api.subscriptionPlan.getAll.useQuery(
    undefined,
    {
      initialData: initialSubscriptionPlans,
      refetchOnMount: true,
    },
  );

  return (
    <div className="max-w-3xl">
      <div className="space-y-4 mb-6">
        {subscriptionPlans.map((plan) => (
          <SubscriptionPlanLink key={plan.id} plan={plan} />
        ))}
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
