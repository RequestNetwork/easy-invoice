import { BackgroundWrapper } from "@/components/background-wrapper";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentSession();
  if (!user) redirect("/");

  return (
    <BackgroundWrapper
      topGradient={{ from: "orange-100", to: "orange-200" }}
      bottomGradient={{ from: "zinc-100", to: "zinc-200" }}
    >
      <Header user={user} />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          View and manage your invoices, track payments, and monitor business
          performance
        </p>
        <DashboardNavigation />
        {children}
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
