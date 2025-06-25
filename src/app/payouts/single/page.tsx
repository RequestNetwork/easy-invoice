import { DirectPayment } from "@/components/direct-payout";

export const metadata = {
  title: "Single Payouts | Easy Invoice",
  description: "Create one time payments using Easy Invoice",
};
export default function SinglePayoutPage() {
  return <DirectPayment />;
}
