import { InvoiceCreator } from "@/components/invoice/invoice-creator";
import { PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { getInvoiceCount } from "@/lib/helpers/invoice";
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
  const user = await requireAuth();
  const invoiceMeLink = await getInvoiceMeLink(params.id);

  if (!invoiceMeLink) {
    notFound();
  }

  if (user.id === invoiceMeLink.user.id) {
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
          user
            ? {
                id: user.id,
                name: user.name ?? "",
                email: user.email ?? "",
              }
            : undefined
        }
        invoiceCount={invoiceCount}
      />
    </>
  );
}
