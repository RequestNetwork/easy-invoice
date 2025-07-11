import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SubscriptionPlans } from "@/components/subscription-plans/subscription-plans";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function SubscriptionPlansPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const subscriptionPlans = await api.subscriptionPlan.getAll.query();

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <SubscriptionPlans initialSubscriptionPlans={subscriptionPlans} />
      </main>
      <Footer />
    </>
  );
}
