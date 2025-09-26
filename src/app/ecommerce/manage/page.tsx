import { EcommerceManage } from "@/components/ecommerce/manage";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ManagePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const clientIds = await api.clientId.getAll.query();

  return <EcommerceManage initialClientIds={clientIds} />;
}
