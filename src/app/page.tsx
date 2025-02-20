import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCurrentSession } from "@/server/auth";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "EasyInvoice | Simple Invoice Management",
  description: "Create, manage and track invoices easily with Request Network",
};

export default async function LoginPage() {
  const { user } = await getCurrentSession();

  if (user) {
    return redirect("/dashboard");
  }

  return (
    <>
      <Header />
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
              EASY TO USE CRYPTO INVOICING
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to EasyInvoice
            </h1>
            <p className="text-zinc-600">
              Easily create and send invoices to your customers using crypto.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login/google"
              className="flex items-center justify-center w-full h-14 text-lg bg-black hover:bg-zinc-800 transition-colors text-white rounded-lg font-bold"
            >
              <Image
                src="/google-icon.svg"
                alt="Google"
                width={24}
                height={24}
                className="mr-3"
              />
              Continue with Google
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
