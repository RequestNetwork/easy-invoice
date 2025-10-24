import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { DirectPayment } from "./_components/direct-payout";

export const metadata = {
  title: "Direct Payout | Easy Invoice",
  description: "Create direct payouts using Easy Invoice",
};
export default async function DirectPaymentPage() {
  await requireAuth();

  return (
    <>
      <PageTitle>Direct Payout</PageTitle>
      <PageDescription>Make a simple payout to your recipient</PageDescription>
      <DirectPayment />
    </>
  );
}
