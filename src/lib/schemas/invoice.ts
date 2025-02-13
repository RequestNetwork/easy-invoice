import { INVOICE_CURRENCIES } from "@/lib/currencies";
import { z } from "zod";

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  dueDate: z.string().min(1, "Due date is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  invoicedTo: z.string().optional(),
  creatorName: z.string().min(1, "Your name is required"),
  creatorEmail: z.string().email("Invalid email address"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        price: z.number().min(0, "Price must be positive"),
      }),
    )
    .min(1, "At least one item is required"),
  notes: z.string().optional(),
  invoiceCurrency: z.enum(INVOICE_CURRENCIES, {
    required_error: "Please select an invoice currency",
  }),
  paymentCurrency: z.string().min(1, "Payment currency is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
