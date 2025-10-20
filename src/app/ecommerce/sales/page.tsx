import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { EcommerceSales } from "./_components/index";

export default async function SalesPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const clientPayments = await api.ecommerce.getAllClientPayments.query();

  return <EcommerceSales initialClientPayments={clientPayments} />;
}
