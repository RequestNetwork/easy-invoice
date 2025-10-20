"use client";
import { ErrorState } from "@/components/ui/table/error-state";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import type { EcommerceClient } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { EcommerceClientsTable } from "./blocks/clients-table";
import { CreateEcommerceClient } from "./blocks/create-client";
import { CreateDefaultEcommerceClient } from "./blocks/create-default-client";

interface EcommerceManageProps {
  initialEcommerceClients: EcommerceClient[];
}

export function EcommerceManage({
  initialEcommerceClients,
}: EcommerceManageProps) {
  const { data, error, refetch, isRefetching } = api.ecommerce.getAll.useQuery(
    undefined,
    {
      initialData: initialEcommerceClients,
      refetchOnMount: true,
    },
  );
  const shouldCreateDefault =
    data.length === 0 ||
    !data.some((c) => c.domain === DEFAULT_CLIENT_ID_DOMAIN);

  if (error) {
    return (
      <ErrorState
        onRetry={refetch}
        isRetrying={isRefetching}
        explanation="We couldn't load the client IDs data. Please try again."
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {shouldCreateDefault ? (
        <>
          <p className="text-sm text-muted-foreground">
            Create a default client to get started by using Request Network
            Checkout
          </p>
          <CreateDefaultEcommerceClient />
        </>
      ) : (
        <CreateEcommerceClient />
      )}
      <EcommerceClientsTable ecommerceClients={data} />
    </div>
  );
}
