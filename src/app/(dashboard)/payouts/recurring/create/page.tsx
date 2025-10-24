import { requireAuth } from "@/lib/auth";
import { CreateRecurringPayment } from "./_components/create-recurring-payment";

export const metadata = {
  title: "Recurring Payments | Easy Invoice",
  description: "Create recurring payments using Easy Invoice",
};
export default async function CreateRecurringPaymentSlot() {
  await requireAuth();

  return <CreateRecurringPayment />;
}
