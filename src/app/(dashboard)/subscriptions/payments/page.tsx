import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { PaymentsTable } from "../_components/payments-table";

export default async function SubscriptionPaymentsPage() {
  await requireAuth();

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
