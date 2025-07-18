"use client";

import type { User } from "@/server/db/schema";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { UserMenu } from "./user-menu";

export function Header({ user }: { user?: User | undefined }) {
  const demoMeetingUrl = process.env.NEXT_PUBLIC_DEMO_MEETING;
  const pathname = usePathname();

  // Don't show nav items on invoice payment pages
  const showNavItems = !pathname.startsWith("/i/");

  return (
    <header className="w-full p-6 z-50 relative">
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-x-2"
        >
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
            <span className="text-white font-bold">EI</span>
          </div>
          <span className="text-xl font-semibold">EasyInvoice</span>
        </Link>

        <div className="flex items-center space-x-4">
          {showNavItems && user && (
            <>
              <Link
                href="/dashboard"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/payouts"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Payouts
              </Link>
              <Link
                href="/invoice-me"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Invoice Me
              </Link>
              <Link
                href="/subscription-plans"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Subscription Plans
              </Link>
              <Link
                href="/crypto-to-fiat"
                className="text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                Crypto-to-fiat
              </Link>
              {demoMeetingUrl && (
                <Link
                  href={demoMeetingUrl}
                  className="font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-400 hover:text-zinc-600 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book A Demo
                </Link>
              )}
              <UserMenu user={user} />
            </>
          )}

          {demoMeetingUrl && !user && (
            <Button
              asChild
              className="bg-black hover:bg-zinc-800 text-white transition-colors"
            >
              <Link
                href={demoMeetingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book A Demo
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
