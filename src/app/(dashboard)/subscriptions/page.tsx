import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { SubscriptionPlansList } from "./_components/subscription-plans-list";

export default async function ManagePlansPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const subscriptionPlans = await api.subscriptionPlan.getAll.query();

  return (
    <>
      <PageTitle>Subscription Plans</PageTitle>
      <PageDescription>Manage your subscription plans</PageDescription>
      <SubscriptionPlansList initialSubscriptionPlans={subscriptionPlans} />
    </>
  );
}
