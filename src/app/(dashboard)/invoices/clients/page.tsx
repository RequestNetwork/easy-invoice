import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { InvoicesSent } from "../_components/invoices-sent";

export default async function GetPaidPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  const invoiceData = await api.invoice.getAllIssuedByMe.query();

  return <InvoicesSent initialSentInvoices={invoiceData} />;
}
