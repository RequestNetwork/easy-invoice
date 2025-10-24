import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { SubscriptionPlansList } from "./_components/subscription-plans-list";

export default async function ManagePlansPage() {
  await requireAuth();

  const subscriptionPlans = await api.subscriptionPlan.getAll.query();

  return (
    <>
      <PageTitle>Subscription Plans</PageTitle>
      <PageDescription>Manage your subscription plans</PageDescription>
      <SubscriptionPlansList initialSubscriptionPlans={subscriptionPlans} />
    </>
  );
}
