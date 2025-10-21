import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { InvoicesTabs } from "./_components/invoices-tabs";

export default async function InvoicesPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const [sentInvoices, receivedInvoices] = await Promise.all([
    api.invoice.getAllIssuedByMe.query(),
    api.invoice.getAllIssuedToMe.query(),
  ]);

  return (
    <>
      <PageTitle>Invoices & Bills</PageTitle>
      <PageDescription>
        Manage your outgoing invoices and incoming bills in one place
      </PageDescription>
      <InvoicesTabs
        initialSentInvoices={sentInvoices}
        initialReceivedInvoices={receivedInvoices}
      />
    </>
  );
}
