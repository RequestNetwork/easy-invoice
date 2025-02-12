"use client";

import { InvoiceForm } from "@/components/invoice-form";
import { InvoicePreview } from "@/components/invoice-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type InvoiceFormValues,
  invoiceFormSchema,
} from "@/lib/schemas/invoice";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function InvoiceCreator() {
  const router = useRouter();

  const { mutate: createInvoice, isLoading } = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully", {
        description: "Redirecting to dashboard in 3 seconds",
      });
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    },
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      dueDate: "",
      clientName: "",
      clientEmail: "",
      items: [{ description: "", quantity: 1, price: 0 }],
      notes: "",
      invoiceCurrency: "USD",
      paymentCurrency: "",
      walletAddress: "",
    },
  });

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      await createInvoice(data);
    } catch (error) {
      toast.error("Failed to create invoice", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>

      <InvoicePreview data={form.watch()} />
    </div>
  );
}
