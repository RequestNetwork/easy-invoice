import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { ViewRecurringPayments } from "./_components/view-recurring-payments";

export const metadata = {
  title: "Recurring Payments | Easy Invoice",
  description: "Manage your recurring payments using Easy Invoice",
};
export default async function RecurringPaymentsSlot() {
  await requireAuth();

  const recurringPayments =
    await api.recurringPayment.getNonSubscriptionRecurringPayments.query();

  return <ViewRecurringPayments initialRecurringPayments={recurringPayments} />;
}
