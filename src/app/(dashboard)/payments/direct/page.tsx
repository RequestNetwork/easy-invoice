import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { DirectPayment } from "./_components/direct-payout";

export const metadata = {
  title: "Direct Payments | Easy Invoice",
  description: "Create direct payments using Easy Invoice",
};
export default async function DirectPaymentPage() {
  await requireAuth();

  return (
    <>
      <PageTitle>Direct Payment</PageTitle>
      <PageDescription>Make a simple payment to your recipient</PageDescription>
      <DirectPayment />
    </>
  );
}
