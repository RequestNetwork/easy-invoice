"use client";
import { ErrorState } from "@/components/ui/table/error-state";
import type { ClientId } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { ClientIdsTable } from "./blocks/client-ids-table";
import { CreateClientId } from "./blocks/create-client-id";
import { CreateDefaultClientId } from "./blocks/create-default-client-id";

interface EcommerceManageProps {
  initialClientIds: ClientId[];
}

export function EcommerceManage({ initialClientIds }: EcommerceManageProps) {
  const shouldCreateDefault = initialClientIds.length === 0;
  const { data, error, refetch, isRefetching } = api.clientId.getAll.useQuery(
    undefined,
    {
      initialData: initialClientIds,
      refetchOnMount: true,
    },
  );

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
      {shouldCreateDefault ? <CreateDefaultClientId /> : <CreateClientId />}
      <ClientIdsTable clientIds={data} />
    </div>
  );
}
