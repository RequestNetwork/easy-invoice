import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { InvoiceTable } from "@/components/invoice-table";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { PlusCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>

          <Link
            href="/invoices/create"
            className="bg-black hover:bg-zinc-800 text-white transition-colors px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </div>

        <InvoiceTable initialInvoices={invoices} />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
