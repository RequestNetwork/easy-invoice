import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { EcommerceManage } from "./_components/index";

export default async function ManagePage() {
  await requireAuth();

  const ecommerceClients = await api.ecommerce.getAll.query();

  return (
    <>
      <PageTitle>Ecommerce Management</PageTitle>
      <PageDescription>Manage your Ecommerce clients</PageDescription>
      <EcommerceManage initialEcommerceClients={ecommerceClients} />
    </>
  );
}
