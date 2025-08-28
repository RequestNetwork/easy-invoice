import { getCurrentSession } from "@/server/auth";
import { DollarSign, FileText, Home, Lock, Wallet, Zap } from "lucide-react";
import Link from "next/link";

export default async function NotFound() {
  const { user } = await getCurrentSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-xl">EI</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-900 mb-4">404</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-gray-600" />
            <span className="text-lg font-medium text-gray-700">
              Page Not Found
            </span>
          </div>
          <p className="text-gray-600 mb-2">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <p className="text-gray-600">
            Your account and invoices remain secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/payouts"
            className="shadow-md group p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Payouts</h3>
            <p className="text-sm text-gray-600">
              Single, batch or recurring payouts
            </p>
          </Link>

          {user ? (
            <Link
              href="/invoices/create"
              className="shadow-md group p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Create Invoice
              </h3>
              <p className="text-sm text-gray-600">
                Start a new payment request
              </p>
            </Link>
          ) : (
            <div className="shadow-md p-6 bg-white rounded-lg border border-gray-200 opacity-75 cursor-not-allowed">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Sign in to create invoices
              </h3>
              <p className="text-sm text-gray-600">
                Start a new payment request
              </p>
            </div>
          )}

          {user ? (
            <Link
              href="/subscription-plans"
              className="shadow-md group p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Subscription Plans
              </h3>
              <p className="text-sm text-gray-600">
                Manage your subscription plans
              </p>
            </Link>
          ) : (
            <div className="shadow-md p-6 bg-white rounded-lg border border-gray-200 opacity-75 cursor-not-allowed">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Sign in to manage subscription plans
              </h3>
              <p className="text-sm text-gray-600">
                View and manage your subscription options
              </p>
            </div>
          )}
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
