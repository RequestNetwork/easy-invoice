import { BackgroundWrapper } from "@/components/background-wrapper";
import { DashboardView } from "@/components/dashboard-view";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard | EasyInvoice",
  description:
    "View and manage your invoices, track payments, and monitor business performance",
};

export default async function DashboardPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const invoices = await api.invoice.getAll.query();

  return (
    <BackgroundWrapper
      topGradient={{ from: "orange-100", to: "orange-200" }}
      bottomGradient={{ from: "zinc-100", to: "zinc-200" }}
    >
      <Header user={user} />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <DashboardView invoices={invoices} />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
