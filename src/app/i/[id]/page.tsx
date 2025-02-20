import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
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
    <BackgroundWrapper
      topGradient={{ from: "purple-100", to: "purple-200" }}
      bottomGradient={{ from: "blue-100", to: "blue-200" }}
    >
      <Header />
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
      <Footer />
    </BackgroundWrapper>
  );
}
