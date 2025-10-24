import { InvoiceCreator } from "@/components/invoice/invoice-creator";
import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { getInvoiceCount } from "@/lib/helpers/invoice";

export default async function CreateInvoicePage() {
  const user = await requireAuth();
  const invoiceCount = await getInvoiceCount(user.id);

  return (
    <>
      <PageTitle>Create invoice</PageTitle>
      <PageDescription>
        Create a new invoice to request payments from your clients.
      </PageDescription>
      <InvoiceCreator
        currentUser={{
          email: user.email ?? "",
          name: user.name ?? "",
          id: user.id,
        }}
        invoiceCount={invoiceCount}
      />
    </>
  );
}
