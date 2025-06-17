import { redirect } from "next/navigation";

export default function RecurringPaymentsSlot() {
  redirect("/payouts/recurring/create");
}
