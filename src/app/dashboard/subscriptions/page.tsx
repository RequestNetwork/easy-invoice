import { Subscriptions } from "@/components/dashboard/subscriptions";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function SubscriptionsPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const subscriptions =
    await api.subscriptionPlan.getUserActiveSubscriptions.query();

  return <Subscriptions initialSubscriptions={subscriptions} />;
}
