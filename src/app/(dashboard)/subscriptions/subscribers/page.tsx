import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { SubscribersTable } from "../_components/subscribers-table";

export default async function SubscribersPage() {
  await requireAuth();

  const [allSubscribers, subscriptionPlans] = await Promise.all([
    api.subscriptionPlan.getAllSubscribers.query(),
    api.subscriptionPlan.getAll.query(),
  ]);

  return (
    <>
      <PageTitle>Subscribers</PageTitle>
      <PageDescription>View all your subscribers</PageDescription>
      <SubscribersTable
        initialSubscribers={allSubscribers}
        subscriptionPlans={subscriptionPlans}
      />
    </>
  );
}
