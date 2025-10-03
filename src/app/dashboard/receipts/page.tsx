import { DashboardReceipts } from "@/components/dashboard/receipts";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ReceiptsPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const clientPayments = await api.ecommerce.getAllUserReceipts.query();

  return <DashboardReceipts initialClientPayments={clientPayments} />;
}
