import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payouts | Easy Invoice",
  description: "Send a single or batch payouts creating a request first",
};

export default function PayoutsPage() {
  return redirect("/payouts/single");
}
