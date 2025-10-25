import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { InvoicesTabs } from "./_components/invoices-tabs";

export default async function InvoicesPage() {
  await requireAuth();

  const [sentInvoices, receivedInvoices] = await Promise.all([
    api.invoice.getAllIssuedByMe(),
    api.invoice.getAllIssuedToMe(),
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
