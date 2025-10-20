import { BatchPayout } from "./_components/batch-payout";

export const metadata = {
  title: "Batch Payouts | Easy Invoice",
  description: "Send batch payouts using Easy Invoice",
};
export default function BatchPayoutSlot() {
  return <BatchPayout />;
}
