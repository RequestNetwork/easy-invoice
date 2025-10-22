import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payments | Easy Invoice",
  description:
    "Send single, batch or recurring payouts by creating a request first",
};

export default function PaymentsPage() {
  return redirect("/payments/direct");
}
