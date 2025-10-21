import { PageDescription, PageTitle } from "@/components/page-elements";
import { DirectPayment } from "./_components/direct-payout";

export const metadata = {
  title: "Single Payouts | Easy Invoice",
  description: "Create one time payments using Easy Invoice",
};
export default function SinglePayoutPage() {
  return (
    <>
      <PageTitle>Direct Payment</PageTitle>
      <PageDescription>Make a simple payment to your recipient</PageDescription>
      <DirectPayment />
    </>
  );
}
