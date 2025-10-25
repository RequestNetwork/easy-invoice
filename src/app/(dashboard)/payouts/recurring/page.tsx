import { requireAuth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { ViewRecurringPayments } from "./_components/view-recurring-payments";

export const metadata = {
  title: "Recurring Payouts | Easy Invoice",
  description: "Manage your recurring payouts using Easy Invoice",
};
export default async function RecurringPayoutsSlot() {
  await requireAuth();

  const recurringPayments =
    await api.recurringPayment.getNonSubscriptionRecurringPayments();

  return <ViewRecurringPayments initialRecurringPayments={recurringPayments} />;
}
