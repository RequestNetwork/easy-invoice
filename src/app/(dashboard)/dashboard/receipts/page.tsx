import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { DashboardReceipts } from "./_components/receipts";

export default async function ReceiptsPage() {
  await requireAuth();

  const clientPayments = await api.ecommerce.getAllUserReceipts();

  return <DashboardReceipts initialClientPayments={clientPayments} />;
}
