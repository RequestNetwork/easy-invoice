import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { InvoiceCreator } from "@/components/invoice/invoice-creator";
import { getInvoiceCount } from "@/lib/helpers/invoice";
import { api } from "@/trpc/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getInvoiceMeLink } from "./helpers";

export const metadata: Metadata = {
  title: "Invoice Me | EasyInvoice",
  description: "Create an invoice for a service provider",
};

export default async function InvoiceMePage({
  params,
}: {
  params: { id: string };
}) {
  // TODO solve unauthenticated access
  const currentUser = await api.auth.getSessionInfo.query();
  const invoiceMeLink = await getInvoiceMeLink(params.id);

  if (!invoiceMeLink) {
    notFound();
  }

  if (currentUser.user && currentUser.user.id === invoiceMeLink.user.id) {
    redirect("/home");
  }

  const invoiceCount = await getInvoiceCount(invoiceMeLink.user.id);

  return (
    <BackgroundWrapper
      topGradient={{ from: "purple-100", to: "purple-200" }}
      bottomGradient={{ from: "blue-100", to: "blue-200" }}
    >
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors mr-4"
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
          currentUser={
            currentUser.user
              ? {
                  id: currentUser.user.id,
                  name: currentUser.user.name ?? "",
                  email: currentUser.user.email ?? "",
                }
              : undefined
          }
          invoiceCount={invoiceCount}
        />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
