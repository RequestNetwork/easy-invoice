import { PageDescription, PageTitle } from "@/components/page-elements";
import { BatchPayout } from "./_components/batch-payout";

export const metadata = {
  title: "Batch Payouts | Easy Invoice",
  description: "Send batch payouts using Easy Invoice",
};
export default function BatchPayoutSlot() {
  return (
    <>
      <PageTitle>Batch Payments</PageTitle>
      <PageDescription>
        Make payments to multiple recipients of your choice
      </PageDescription>
      <BatchPayout />
    </>
  );
}
