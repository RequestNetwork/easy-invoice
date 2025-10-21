import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { SubscribersTable } from "../_components/subscribers-table";

export default async function SubscribersPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

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
