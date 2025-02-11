"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceFormValues, invoiceFormSchema } from "@/lib/schemas/invoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "@/components/invoice-form";
import { InvoicePreview } from "@/components/invoice-preview";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function InvoiceCreator() {
  const router = useRouter();

  const { mutate: createInvoice, isLoading } = api.invoice.create.useMutation({
    onSuccess: (data) => {
      if(!data.invoice) {
        toast.error("Failed to create invoice", {
          description: "Please try again",
        });
      return;
      }

      toast.success("Invoice created successfully" , {
        description: "Redirecting to invoice details in 3 seconds",
      });
      setTimeout(() => {
        router.push(`/invoices/${data.invoice.id}`);
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
      cryptocurrency: "eth",
      walletAddress: "",
      clientWallet: "",
    },
  });

  const onSubmit = async (data: InvoiceFormValues) => {
    try{
      await createInvoice(data);
    } catch (error) {
      toast.error("Failed to create invoice", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
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
