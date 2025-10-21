import { PageDescription, PageTitle } from "@/components/page-elements";
import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { CryptoToFiat } from "./_components/crypto-to-fiat";

export default async function CryptoToFiatPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/signin");
  }

  return (
    <>
      <PageTitle>Crypto-to-fiat</PageTitle>
      <PageDescription>Pay fiat invoices with crypto</PageDescription>
      <CryptoToFiat user={user} />
    </>
  );
}
