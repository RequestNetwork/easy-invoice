"use client";

import { InvoiceForm } from "@/components/invoice-form";
import { InvoicePreview } from "@/components/invoice-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInvoiceNumber } from "@/lib/invoice/client";
import {
  type InvoiceFormValues,
  invoiceFormSchema,
} from "@/lib/schemas/invoice";
import type { User } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface InvoiceCreatorProps {
  recipientDetails?: {
    clientName: string;
    clientEmail: string;
    userId: string;
  };
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
  invoiceCount: string;
}

export function InvoiceCreator({
  recipientDetails,
  currentUser,
  invoiceCount,
}: InvoiceCreatorProps) {
  const router = useRouter();
  const isInvoiceMe = !!recipientDetails?.userId;

  const { mutate: createInvoice, isLoading } = isInvoiceMe
    ? api.invoice.createFromInvoiceMe.useMutation({
        onSuccess: () => {
          toast.success("Invoice created successfully", {
            description: "You can safely close this page now",
          });
        },
      })
    : api.invoice.create.useMutation({
        onSuccess: () => {
          toast.success("Invoice created successfully");
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        },
      });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: generateInvoiceNumber(invoiceCount),
      dueDate: "",
      creatorName: !isInvoiceMe ? (currentUser?.name ?? "") : "",
      creatorEmail: !isInvoiceMe ? (currentUser?.email ?? "") : "",
      clientName: recipientDetails?.clientName ?? "",
      clientEmail: recipientDetails?.clientEmail ?? "",
      invoicedTo: recipientDetails?.userId ?? "",
      items: [{ description: "", quantity: 1, price: 0 }],
      notes: "",
      invoiceCurrency: "USD",
      paymentCurrency: "",
      walletAddress: "",
      isCryptoToFiatAvailable: false,
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    try {
      createInvoice(data);
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
          <InvoiceForm
            currentUser={
              currentUser
                ? ({
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                  } as User)
                : (undefined as unknown as User)
            }
            form={form}
            onSubmit={onSubmit}
            isLoading={isLoading}
            recipientDetails={recipientDetails}
          />
        </CardContent>
      </Card>

      <InvoicePreview
        data={form.watch()}
        paymentDetailsId={form.watch("paymentDetailsId")}
      />
    </div>
  );
}
