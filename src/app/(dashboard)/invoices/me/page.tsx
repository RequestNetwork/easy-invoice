import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { InvoiceMeLinks } from "./_components/invoice-me-links";

export default async function InvoiceMePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const links = await api.invoiceMe.getAll.query();

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
