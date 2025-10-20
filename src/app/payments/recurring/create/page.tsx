import { CreateRecurringPayment } from "@/components/recurring-payments/create-recurring-payment/create-recurring-payment";

export const metadata = {
  title: "Recurring Payments | Easy Invoice",
  description: "Create recurring payments using Easy Invoice",
};
export default function CreateRecurringPaymentSlot() {
  return <CreateRecurringPayment />;
}
