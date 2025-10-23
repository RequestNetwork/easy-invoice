"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateDefaultEcommerceClient() {
  const utils = api.useUtils();

  const { mutate: createEcommerceClientMutation, isPending } =
    api.ecommerce.create.useMutation({
      onSuccess: () => {
        toast.success("Default client created successfully");
        utils.ecommerce.getAll.invalidate();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create default client");
      },
    });

  const handleCreateDefault = () => {
    createEcommerceClientMutation({
      label: "Request Checkout",
      domain: DEFAULT_CLIENT_ID_DOMAIN,
    });
  };

  return (
    <Button
      onClick={handleCreateDefault}
      disabled={isPending}
      variant="default"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Default Client
    </Button>
  );
}
