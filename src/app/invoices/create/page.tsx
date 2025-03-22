import { BackgroundWrapper } from "@/components/background-wrapper";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { InvoiceCreator } from "@/components/invoice-creator";
import { getInvoiceCount } from "@/lib/invoice";
import { getCurrentSession } from "@/server/auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CreateInvoicePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const invoiceCount = await getInvoiceCount(user.id);

  return (
    <BackgroundWrapper
      topGradient={{ from: "purple-100", to: "purple-200" }}
      bottomGradient={{ from: "blue-100", to: "blue-200" }}
    >
      <Header />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="text-zinc-600 hover:text-black transition-colors mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">
            Create New Invoice
          </h1>
        </div>

        <InvoiceCreator
          currentUser={{
            email: user.email ?? "",
            name: user.name ?? "",
          }}
          invoiceCount={invoiceCount}
        />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}
