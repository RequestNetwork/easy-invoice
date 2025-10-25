"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EcommerceClientForm } from "./client-form";
import type { EcommerceClientFormValues } from "./types";

export function CreateEcommerceClient() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();

  const { mutate: createEcommerceClientMutation, isPending } =
    api.ecommerce.create.useMutation({
      onSuccess: () => {
        toast.success("Client ID created successfully");
        utils.ecommerce.getAll.invalidate();
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create client ID");
      },
    });

  const handleSubmit = (data: EcommerceClientFormValues) => {
    createEcommerceClientMutation(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Ecommerce Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Ecommerce Client</DialogTitle>
        </DialogHeader>
        {isOpen && (
          <EcommerceClientForm
            onSubmit={handleSubmit}
            isLoading={isPending}
            submitButtonText="Create Client"
            onCancel={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
