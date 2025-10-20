import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { InvoicesReceived } from "./_components/invoices-received";

export default async function PayPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const invoiceData = await api.invoice.getAllIssuedToMe.query();

  return <InvoicesReceived initialReceivedInvoices={invoiceData} />;
}
