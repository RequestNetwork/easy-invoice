"use client";

import { ErrorState } from "@/components/ui/table/error-state";
import type { ClientPayment, EcommerceClient } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { ClientPaymentsTable } from "./blocks/client-payments-table";

interface EcommerceSalesProps {
  initialClientPayments: ClientPayment[];
  ecommerceClients: EcommerceClient[];
}

export function EcommerceSales({
  initialClientPayments,
  ecommerceClients,
}: EcommerceSalesProps) {
  const { data, error, refetch, isRefetching } =
    api.ecommerce.getAllClientPayments.useQuery(undefined, {
      initialData: initialClientPayments,
      refetchOnMount: true,
    });

  if (error) {
    return (
      <ErrorState
        onRetry={refetch}
        isRetrying={isRefetching}
        explanation="We couldn't load the client payments data. Please try again."
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Client Payments</h1>
        <p className="text-sm text-muted-foreground">
          View all payments received through your ecommerce integrations
        </p>
      </div>
      <ClientPaymentsTable
        clientPayments={data}
        ecommerceClients={ecommerceClients}
      />
    </div>
  );
}
