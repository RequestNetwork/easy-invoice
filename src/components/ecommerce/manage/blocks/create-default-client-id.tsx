"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateDefaultClientId() {
  const utils = api.useUtils();

  const createClientId = api.clientId.create.useMutation({
    onSuccess: () => {
      toast.success("Default client ID created successfully");
      utils.clientId.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create default client ID");
    },
  });

  const handleCreateDefault = () => {
    createClientId.mutate({
      label: "Default Ecommerce",
      domain: DEFAULT_CLIENT_ID_DOMAIN,
    });
  };

  return (
    <Button
      onClick={handleCreateDefault}
      disabled={createClientId.isLoading}
      variant="default"
    >
      {createClientId.isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      Create Default Client ID
    </Button>
  );
}
