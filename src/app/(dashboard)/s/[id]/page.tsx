import { PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubscriptionPlanPreview } from "./_components/subscription-plan-preview";
import { getSubscriptionPlan } from "./helpers";

export const metadata: Metadata = {
  title: "Subscribe | EasyInvoice",
  description: "Subscribe to a service provider",
};

export default async function SubscriptionPlanPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const subscriptionPlan = await getSubscriptionPlan(params.id);

  if (!subscriptionPlan) {
    notFound();
  }

  return (
    <>
      <PageTitle className="mb-8">
        Subscribe to {subscriptionPlan.label}
      </PageTitle>
      <SubscriptionPlanPreview
        subscriptionPlan={subscriptionPlan}
        recipientEmail={subscriptionPlan.user.email ?? ""}
      />
    </>
  );
}
