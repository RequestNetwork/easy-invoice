import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SubscriptionPlanPreview } from "@/components/subscription-plan-preview";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Subscribe | EasyInvoice",
  description: "Subscribe to a service provider",
};

export default async function SubscriptionPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const subscriptionPlan = await api.subscriptionPlan.getById.query(params.id);

  if (!subscriptionPlan) {
    notFound();
  }

  return (
    <BackgroundWrapper
      topGradient={{ from: "purple-100", to: "purple-200" }}
      bottomGradient={{ from: "blue-100", to: "blue-200" }}
    >
      <Header />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <SubscriptionPlanPreview
          subscriptionPlan={subscriptionPlan}
          recipientEmail={subscriptionPlan.user.email ?? ""}
        />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
