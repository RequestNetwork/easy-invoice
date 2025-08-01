import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PaymentsTable } from "@/components/subscription-plans/blocks/payments-table";
import { SubscribersTable } from "@/components/subscription-plans/blocks/subscribers-table";
import { SubscriptionPlansList } from "@/components/subscription-plans/blocks/subscription-plans-list";
import { SubscriptionPlanTabs } from "@/components/subscription-plans/subscription-plan-tabs";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SubscriptionPlansPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const [subscriptionPlans, allSubscribers, allPayments] = await Promise.all([
    api.subscriptionPlan.getAll.query(),
    api.subscriptionPlan.getAllSubscribers.query(),
    api.subscriptionPlan.getAllPayments.query(),
  ]);

  const plansTab = (
    <SubscriptionPlansList initialSubscriptionPlans={subscriptionPlans} />
  );
  const subscribersTab = (
    <SubscribersTable
      initialSubscribers={allSubscribers}
      subscriptionPlans={subscriptionPlans}
    />
  );
  const paymentsTab = (
    <PaymentsTable
      initialPayments={allPayments}
      subscriptionPlans={subscriptionPlans}
    />
  );

  return (
    <>
      <Header user={user} />
      <main className="flex-grow flex flex-col w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[72rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="text-zinc-600 hover:text-black transition-colors mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Subscription Plans
          </h1>
        </div>

        <SubscriptionPlanTabs
          plansTab={plansTab}
          subscribersTab={subscribersTab}
          paymentsTab={paymentsTab}
        />
      </main>
      <Footer />
    </>
  );
}
