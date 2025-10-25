import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { EcommerceSales } from "./_components/index";

export default async function SalesPage() {
  await requireAuth();

  const clientPayments = await api.ecommerce.getAllClientPayments();

  return (
    <>
      <PageTitle>Ecommerce Sales</PageTitle>
      <PageDescription>View all sales made by your clients</PageDescription>
      <EcommerceSales initialClientPayments={clientPayments} />
    </>
  );
}
