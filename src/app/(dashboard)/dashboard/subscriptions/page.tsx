import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { Subscriptions } from "./_components/subscriptions";

export default async function SubscriptionsPage() {
  await requireAuth();

  const subscriptions =
    await api.subscriptionPlan.getUserActiveSubscriptions.query();

  return <Subscriptions initialSubscriptions={subscriptions} />;
}
