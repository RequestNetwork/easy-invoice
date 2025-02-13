import { InvoiceMeLinks } from "@/components/invoice-me-links";
import { UserMenu } from "@/components/user-menu";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Invoice Me Links | EasyInvoice",
  description: "Manage your invoice me links",
};

export default async function InvoiceMePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  const links = await api.invoiceMe.getAll.query();

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-purple-200 opacity-30 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 opacity-30 blur-3xl" />
      </div>

      {/* Dot pattern background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e5e5e5 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6 z-50 relative">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-x-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <span className="text-white font-bold">EI</span>
              </div>
              <span className="text-xl font-semibold">EasyInvoice</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/invoice-me"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Invoice Me
              </Link>
              <UserMenu user={user} />
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <InvoiceMeLinks initialLinks={links} />
      </div>
    </div>
  );
}
