"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EcommerceClient } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteEcommerceClientProps {
  ecommerceClient: EcommerceClient;
  children: React.ReactNode;
}

export function DeleteEcommerceClient({
  ecommerceClient,
  children,
}: DeleteEcommerceClientProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const utils = api.useUtils();

  const {
    mutate: deleteEcommerceClientMutation,
    isLoading: isDeletingEcommerceClient,
  } = api.ecommerce.delete.useMutation({
    onSuccess: () => {
      toast.success("Client ID deleted successfully");
      utils.ecommerce.getAll.invalidate();
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete client ID");
    },
  });

  const handleDeleteEcommerceClient = async () => {
    deleteEcommerceClientMutation(ecommerceClient.id);
  };

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client ID</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the client ID "
              {ecommerceClient.label}"?
            </p>
            <p className="font-medium text-red-600">
              ⚠️ This action cannot be undone. The client ID will be permanently
              removed and any integrations using it will stop working.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingEcommerceClient}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteEcommerceClient}
            disabled={isDeletingEcommerceClient}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeletingEcommerceClient ? "Deleting..." : "Delete Client ID"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
