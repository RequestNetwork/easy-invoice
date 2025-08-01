import { ViewRecurringPayments } from "@/components/view-recurring-payments/view-recurring-payments";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Recurring Payments | Easy Invoice",
  description: "Manage your recurring payments using Easy Invoice",
};
export default async function RecurringPaymentsSlot() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const recurringPayments =
    await api.recurringPayment.getNonSubscriptionRecurringPayments.query();

  return <ViewRecurringPayments initialRecurringPayments={recurringPayments} />;
}
