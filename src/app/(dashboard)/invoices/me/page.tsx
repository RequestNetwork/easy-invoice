import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { InvoiceMeLinks } from "./_components/invoice-me-links";

export default async function InvoiceMePage() {
  await requireAuth();

  const links = await api.invoiceMe.getAll();

  return (
    <>
      <PageTitle>InvoiceMe Links</PageTitle>
      <PageDescription>
        Create and configure your public InvoiceMe links
      </PageDescription>
      <InvoiceMeLinks initialLinks={links} />
    </>
  );
}
