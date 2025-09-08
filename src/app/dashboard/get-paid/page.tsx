import { InvoicesSent } from "@/components/dashboard/invoices-sent";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function GetPaidPage() {
  const { user, session } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const invoiceData = await api.invoice.getAllIssuedByMe.query();

  return <InvoicesSent initialSentInvoices={invoiceData} session={session} />;
}
