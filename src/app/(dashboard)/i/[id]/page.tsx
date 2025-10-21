import { InvoiceCreator } from "@/components/invoice/invoice-creator";
import { PageTitle } from "@/components/page-elements";
import { getInvoiceCount } from "@/lib/helpers/invoice";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
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
    <>
      <PageTitle className="mb-8">
        Create Invoice for {invoiceMeLink.label}
      </PageTitle>
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
    </>
  );
}
