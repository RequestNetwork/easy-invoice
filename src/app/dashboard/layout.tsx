import { BackgroundWrapper } from "@/components/background-wrapper";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Web3AuthRNProvider } from "@/components/web3auth-rn-provider";
import { getCurrentSession } from "@/server/auth";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = await getCurrentSession();
  if (!user) redirect("/");

  return (
    <Web3AuthRNProvider session={session}>
      <BackgroundWrapper
        topGradient={{ from: "orange-100", to: "orange-200" }}
        bottomGradient={{ from: "zinc-100", to: "zinc-200" }}
      >
        <Header user={user} />
        <main className="flex-grow flex flex-col w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[72rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              Dashboard
            </h1>
            <Link
              href="/invoices/create"
              className="bg-black hover:bg-zinc-800 text-white transition-colors px-4 py-2 rounded-md flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </div>
          <DashboardNavigation />
          {children}
        </main>
        <Footer />
      </BackgroundWrapper>
    </Web3AuthRNProvider>
  );
}
