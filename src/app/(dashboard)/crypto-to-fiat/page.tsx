import { PageDescription, PageTitle } from "@/components/page-elements";
import { requireAuth } from "@/lib/auth";
import { CryptoToFiat } from "./_components/crypto-to-fiat";

export default async function CryptoToFiatPage() {
  const user = await requireAuth();

  return (
    <>
      <PageTitle>Crypto-to-fiat</PageTitle>
      <PageDescription>Pay fiat invoices with crypto</PageDescription>
      <CryptoToFiat user={user} />
    </>
  );
}
