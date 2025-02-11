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
    <div className="min-h-screen relative overflow-hidden bg-[#FAFAFA]">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-100 to-orange-200 opacity-50 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-zinc-100 to-zinc-200 opacity-50 blur-3xl" />
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
        <header className="w-full p-6">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-x-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <span className="text-white font-bold">EI</span>
              </div>
              <span className="text-xl font-semibold">EasyInvoice</span>
            </div>
          </nav>
        </header>

        <main className="flex-grow flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
                EASY TO USE CRYPTO INVOICING{" "}
              </div>{" "}
              <h1 className="text-4xl font-bold tracking-tight">
                {" "}
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

        <footer className="w-full p-6">
          <div className="max-w-7xl mx-auto flex justify-center items-center text-sm text-zinc-600">
            <div>
              © 2025 EasyInvoice. All rights reserved. Built by{" "}
              <Link href="https://request.network" className="underline">
                Request Network
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
