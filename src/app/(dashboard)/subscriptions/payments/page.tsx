import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { PaymentsTable } from "../_components/payments-table";

export default async function SubscriptionPaymentsPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const [allPayments, subscriptionPlans] = await Promise.all([
    api.subscriptionPlan.getAllPayments.query(),
    api.subscriptionPlan.getAll.query(),
  ]);

  return (
    <>
      <PageTitle>Subscription Payments</PageTitle>
      <PageDescription>
        View all payments made for your subscription plans
      </PageDescription>
      <PaymentsTable
        initialPayments={allPayments}
        subscriptionPlans={subscriptionPlans}
      />
    </>
  );
}
