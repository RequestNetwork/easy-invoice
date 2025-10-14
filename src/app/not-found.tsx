import { getCurrentSession } from "@/server/auth";
import { DollarSign, FileText, Home, Lock, Wallet, Zap } from "lucide-react";
import Link from "next/link";

export default async function NotFound() {
  const { user } = await getCurrentSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-xl bg-foreground flex items-center justify-center mx-auto mb-6">
            <span className="text-background font-bold text-xl">EI</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-8xl font-bold text-foreground mb-4">404</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">
              Page Not Found
            </span>
          </div>
          <p className="text-muted-foreground mb-2">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <p className="text-muted-foreground">
            Your account and invoices remain secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/payouts"
            className="shadow-md group p-6 bg-card rounded-lg border border-border hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-2">Payouts</h3>
            <p className="text-sm text-muted-foreground">
              Single, batch or recurring payouts
            </p>
          </Link>

          {user ? (
            <Link
              href="/invoices/create"
              className="shadow-md group p-6 bg-card rounded-lg border border-border hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Create Invoice
              </h3>
              <p className="text-sm text-muted-foreground">
                Start a new payment request
              </p>
            </Link>
          ) : (
            <div className="shadow-md p-6 bg-card rounded-lg border border-border opacity-75 cursor-not-allowed">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Sign in to create invoices
              </h3>
              <p className="text-sm text-muted-foreground">
                Start a new payment request
              </p>
            </div>
          )}

          {user ? (
            <Link
              href="/subscription-plans"
              className="shadow-md group p-6 bg-card rounded-lg border border-border hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Subscription Plans
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your subscription plans
              </p>
            </Link>
          ) : (
            <div className="shadow-md p-6 bg-card rounded-lg border border-border opacity-75 cursor-not-allowed">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Sign in to manage subscription plans
              </h3>
              <p className="text-sm text-muted-foreground">
                View and manage your subscription options
              </p>
            </div>
          )}
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
