import { CryptoToFiat } from "@/components/crypto-to-fiat";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function CryptoToFiatPage() {
  const { user } = await getCurrentSession();

  // Redirect to home if not logged in
  if (!user) {
    redirect("/");
  }

  return (
    <>
      <Header user={user} />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          Crypto-to-fiat
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Pay fiat invoices with crypto
        </p>

        <CryptoToFiat user={user} />
      </main>
      <Footer />
    </>
  );
}
