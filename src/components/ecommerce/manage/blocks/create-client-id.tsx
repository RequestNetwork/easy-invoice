"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { clientIdApiSchema } from "@/lib/schemas/client-id";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

const createClientIdFormSchema = clientIdApiSchema;

type CreateClientIdFormValues = z.infer<typeof createClientIdFormSchema>;

export function CreateClientId() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();

  const { mutate: createClientIdMutation, isLoading } =
    api.clientId.create.useMutation({
      onSuccess: () => {
        toast.success("Client ID created successfully");
        utils.clientId.getAll.invalidate();
        setIsOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create client ID");
      },
    });

  const form = useForm<CreateClientIdFormValues>({
    resolver: zodResolver(createClientIdFormSchema),
    defaultValues: {
      label: "",
      domain: "",
      feeAddress: undefined,
      feePercentage: undefined,
    },
  });

  const onSubmit = async (data: CreateClientIdFormValues) => {
    createClientIdMutation(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Client ID
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Client ID</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Ecommerce Store"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://mystore.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Address (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      className="font-mono"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Percentage (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isLoading}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ?? undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Client ID
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
