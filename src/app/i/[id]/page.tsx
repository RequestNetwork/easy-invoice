import { InvoiceCreator } from "@/components/invoice-creator";
import { api } from "@/trpc/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Invoice Me | EasyInvoice",
  description: "Create an invoice for a service provider",
};

export default async function InvoiceMePage({
  params,
}: {
  params: { id: string };
}) {
  const invoiceMeLink = await api.invoiceMe.getById.query(params.id);

  if (!invoiceMeLink) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-purple-200 opacity-30 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 opacity-30 blur-3xl" />
      </div>

      {/* Dot pattern background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e5e5e5 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6 z-10">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-x-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <span className="text-white font-bold">EI</span>
              </div>
              <span className="text-xl font-semibold">EasyInvoice</span>
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <div className="flex items-center mb-8">
            <Link
              href="/"
              className="text-zinc-600 hover:text-black transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">
              Create Invoice for {invoiceMeLink.label}
            </h1>
          </div>

          <InvoiceCreator
            recipientDetails={{
              clientName: invoiceMeLink.user.name ?? "",
              clientEmail: invoiceMeLink.user.email ?? "",
              userId: invoiceMeLink.user.id,
            }}
          />
        </main>
      </div>
    </div>
  );
}
