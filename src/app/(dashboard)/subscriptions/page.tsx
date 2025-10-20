import { Footer } from "@/components/footer";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
      <main className="flex-grow flex flex-col w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[72rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Subscription Plans
          </h1>
        </div>

        <SubscriptionPlansList initialSubscriptionPlans={subscriptionPlans} />
      </main>
      <Footer />
    </>
  );
}
