import { InvoicesReceived } from "@/components/dashboard/invoices-received";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function PayPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const invoiceData = await api.invoice.getAllIssuedToMe.query();

  return <InvoicesReceived initialReceivedInvoices={invoiceData} />;
}
