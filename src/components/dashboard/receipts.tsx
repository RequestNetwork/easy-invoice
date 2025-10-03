"use client";

import type { ClientPayment } from "@/server/db/schema";

interface DashboardReceiptsProps {
  initialClientPayments: ClientPayment[];
}

export function DashboardReceipts({
  initialClientPayments,
}: DashboardReceiptsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Receipts</h1>
        <p className="text-sm text-muted-foreground">
          View all your payment receipts from ecommerce transactions
        </p>
      </div>
      <div className="p-8 bg-zinc-50 rounded-lg text-center">
        <p className="text-zinc-600">Receipts component coming soon...</p>
        <p className="text-sm text-zinc-500 mt-2">
          Found {initialClientPayments.length} payment receipts
        </p>
      </div>
    </div>
  );
}
