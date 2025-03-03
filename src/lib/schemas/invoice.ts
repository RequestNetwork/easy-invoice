import { INVOICE_CURRENCIES } from "@/lib/currencies";
import { isEthereumAddress } from "validator";
import { z } from "zod";

export const invoiceFormSchema = z
  .object({
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
    walletAddress: z
      .string()
      .refine(isEthereumAddress, "Invalid wallet address"),
    isRecurring: z.boolean().default(false),
    startDate: z.string().optional(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  })
  .refine(
    (data) => {
      // If invoice is recurring, startDate and frequency must be provided
      if (data.isRecurring) {
        return !!data.startDate && !!data.frequency;
      }
      return true;
    },
    {
      message: "Start date and frequency are required for recurring invoices",
      path: ["isRecurring"],
    },
  );

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
