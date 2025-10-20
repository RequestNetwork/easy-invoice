"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  type EcommerceClientFormValues,
  ecommerceClientFormSchema,
} from "./types";

interface EcommerceClientFormProps {
  onSubmit: (data: EcommerceClientFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<EcommerceClientFormValues>;
  submitButtonText: string;
  onCancel?: () => void;
}

export function EcommerceClientForm({
  onSubmit,
  isLoading = false,
  defaultValues,
  submitButtonText,
  onCancel,
}: EcommerceClientFormProps) {
  const form = useForm<EcommerceClientFormValues>({
    resolver: zodResolver(ecommerceClientFormSchema),
    defaultValues: {
      label: "",
      domain: "",
      feeAddress: undefined,
      feePercentage: undefined,
      ...defaultValues,
    },
  });

  return (
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitButtonText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
