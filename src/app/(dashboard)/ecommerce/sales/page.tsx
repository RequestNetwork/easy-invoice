import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { EcommerceSales } from "./_components/index";

export default async function SalesPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const clientPayments = await api.ecommerce.getAllClientPayments.query();

  return (
    <>
      <PageTitle>Ecommerce Sales</PageTitle>
      <PageDescription>View all sales made by your clients</PageDescription>
      <EcommerceSales initialClientPayments={clientPayments} />
    </>
  );
}
