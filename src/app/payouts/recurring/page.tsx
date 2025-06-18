import { ViewRecurringPayments } from "@/components/view-recurring-payments/view-recurring-payments";

export const metadata = {
  title: "Recurring Payments | Easy Invoice",
  description: "Manage your recurring payments using Easy Invoice",
};
export default function RecurringPaymentsSlot() {
  return <ViewRecurringPayments />;
}
