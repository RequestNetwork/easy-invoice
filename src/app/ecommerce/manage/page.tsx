import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { EcommerceManage } from "./_components/index";

export default async function ManagePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const ecommerceClients = await api.ecommerce.getAll.query();

  return <EcommerceManage initialEcommerceClients={ecommerceClients} />;
}
