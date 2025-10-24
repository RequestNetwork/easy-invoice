"use client";

import { ErrorState } from "@/components/ui/table/error-state";
import type { ClientPaymentWithEcommerceClient } from "@/lib/types";
import { api } from "@/trpc/react";
import { ClientPaymentsTable } from "./blocks/client-payments-table";

interface EcommerceSalesProps {
  initialClientPayments: ClientPaymentWithEcommerceClient[];
}

export function EcommerceSales({ initialClientPayments }: EcommerceSalesProps) {
  const { data, error, refetch, isRefetching } =
    api.ecommerce.getAllClientPayments.useQuery(undefined, {
      initialData: initialClientPayments,
      refetchOnMount: true,
      refetchInterval: 10000,
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

  return <ClientPaymentsTable clientPayments={data} />;
}
