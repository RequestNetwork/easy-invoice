import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PayoutNavigation } from "@/components/payout-navigation";
import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function PayoutsLayout({
  children,
}: {
  children: React.ReactNode;
  tabs: React.ReactNode;
}) {
  const { user } = await getCurrentSession();
  if (!user) redirect("/");

  return (
    <BackgroundWrapper
      topGradient={{ from: "blue-100", to: "indigo-200" }}
      bottomGradient={{ from: "zinc-100", to: "zinc-200" }}
    >
      <Header user={user} />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Payouts</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Send a single or batch payouts creating a request first
        </p>
        <PayoutNavigation />
        {children}
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
