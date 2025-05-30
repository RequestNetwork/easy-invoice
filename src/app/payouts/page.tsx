import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PayoutTabs } from "@/components/payout-tabs";
import { getCurrentSession } from "@/server/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payouts | Easy Invoice",
  description:
    "Make a single or batch payouts without having to create a request first",
};

export default async function DirectPaymentPage() {
  const { user } = await getCurrentSession();

  // Redirect to home if not logged in
  if (!user) {
    redirect("/");
  }

  return (
    <BackgroundWrapper
      topGradient={{ from: "blue-100", to: "indigo-200" }}
      bottomGradient={{ from: "zinc-100", to: "zinc-200" }}
    >
      <Header user={user} />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Payouts</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Send payments quickly without having to create a request first.
        </p>

        <PayoutTabs />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
