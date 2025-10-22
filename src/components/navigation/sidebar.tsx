"use client";

import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  Home,
  Repeat,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Section = "billing" | "subscriptions" | "payouts" | "ecommerce";

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<
    Record<Section, boolean>
  >({
    billing: false,
    subscriptions: false,
    payouts: false,
    ecommerce: false,
  });

  const toggleSection = (section: Section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    if (pathname.startsWith("/invoices")) {
      setExpandedSections((prev) => ({ ...prev, billing: true }));
    } else if (pathname.startsWith("/subscriptions")) {
      setExpandedSections((prev) => ({ ...prev, subscriptions: true }));
    } else if (pathname.startsWith("/payments")) {
      setExpandedSections((prev) => ({ ...prev, payouts: true }));
    } else if (pathname.startsWith("/ecommerce")) {
      setExpandedSections((prev) => ({ ...prev, ecommerce: true }));
    }
  }, [pathname]);

  return (
    <aside className="w-64 bg-background border-r border-border overflow-y-auto flex-shrink-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Request Dashboard</h1>
        <p className="text-sm text-muted-foreground">Crypto Payments</p>
      </div>
      <nav className="p-4 space-y-2">
        <Link
          href="/home"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            pathname === "/home"
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Homepage</span>
        </Link>

        <Link
          href="/crypto-to-fiat"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            pathname === "/crypto-to-fiat"
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <ArrowLeftRight className="h-5 w-5" />
          <span className="font-medium">Crypto-to-Fiat</span>
        </Link>

        <div className="pt-4 pb-2">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Modules
          </h3>
        </div>

        <div>
          <button
            type="button"
            onClick={() => toggleSection("billing")}
            className="flex items-center justify-between w-full px-3 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5" />
              <span className="font-medium">Billing</span>
            </div>
            {expandedSections.billing ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedSections.billing && (
            <div className="ml-8 mt-1 space-y-1">
              <Link
                href="/invoices"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/invoices"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                View Invoices
              </Link>
              <Link
                href="/invoices/create"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/invoices/create"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Create Invoice
              </Link>
              <Link
                href="/invoices/me"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/invoices/me"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                InvoiceMe Link
              </Link>
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => toggleSection("ecommerce")}
            className="flex items-center justify-between w-full px-3 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">Ecommerce</span>
            </div>
            {expandedSections.ecommerce ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedSections.ecommerce && (
            <div className="ml-8 mt-1 space-y-1">
              <Link
                href="/ecommerce/manage"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/ecommerce/manage"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Clients
              </Link>
              <Link
                href="/ecommerce/sales"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/ecommerce/sales"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Sales
              </Link>
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => toggleSection("subscriptions")}
            className="flex items-center justify-between w-full px-3 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Repeat className="h-5 w-5" />
              <span className="font-medium">Subscriptions</span>
            </div>
            {expandedSections.subscriptions ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedSections.subscriptions && (
            <div className="ml-8 mt-1 space-y-1">
              <Link
                href="/subscriptions"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/subscriptions"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Manage Plans
              </Link>
              <Link
                href="/subscriptions/subscribers"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/subscriptions/subscribers"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Subscribers
              </Link>
              <Link
                href="/subscriptions/payments"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/subscriptions/payments"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Payments
              </Link>
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => toggleSection("payouts")}
            className="flex items-center justify-between w-full px-3 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Payments</span>
            </div>
            {expandedSections.payouts ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedSections.payouts && (
            <div className="ml-8 mt-1 space-y-1">
              <Link
                href="/payments/direct"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/payments/direct"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Pay
              </Link>
              <Link
                href="/payments/batch"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === "/payments/batch"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Batch Payments
              </Link>
              <Link
                href="/payments/recurring"
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname.startsWith("/payments/recurring")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Recurring Payments
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
