import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { InvoiceMeLinks } from "./_components/invoice-me-links";

export default async function InvoiceMePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const links = await api.invoiceMe.getAll.query();

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <InvoiceMeLinks initialLinks={links} />
      </main>
      <Footer />
    </>
  );
}
