import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { EcommerceManage } from "./_components/index";

export default async function ManagePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const ecommerceClients = await api.ecommerce.getAll.query();

  return (
    <>
      <PageTitle>Ecommerce Management</PageTitle>
      <PageDescription>Manage your Ecommerce clients</PageDescription>
      <EcommerceManage initialEcommerceClients={ecommerceClients} />
    </>
  );
}
