"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EcommerceClient } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";
import { EcommerceClientForm } from "./client-form";
import type { EcommerceClientFormValues } from "./types";

interface EditEcommerceClientProps {
  ecommerceClient: EcommerceClient;
  children: React.ReactNode;
}

export function EditEcommerceClient({
  ecommerceClient,
  children,
}: EditEcommerceClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();

  const { mutate: editEcommerceClientMutation, isLoading } =
    api.ecommerce.edit.useMutation({
      onSuccess: () => {
        toast.success("Client ID updated successfully");
        utils.ecommerce.getAll.invalidate();
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update client ID");
      },
    });

  const handleSubmit = (data: EcommerceClientFormValues) => {
    editEcommerceClientMutation({
      ...data,
      id: ecommerceClient.id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ecommerce Client</DialogTitle>
        </DialogHeader>
        {isOpen && (
          <EcommerceClientForm
            key={ecommerceClient.id}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            defaultValues={{
              label: ecommerceClient.label,
              domain: ecommerceClient.domain,
              feeAddress: ecommerceClient.feeAddress || undefined,
              feePercentage: ecommerceClient?.feePercentage ?? undefined,
            }}
            submitButtonText="Update Client"
            onCancel={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
