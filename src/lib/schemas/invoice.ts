import { INVOICE_CURRENCIES } from "@/lib/constants/currencies";
import { z } from "zod";

export const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

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
          price: z.number().positive("Price must be greater than 0"),
        }),
      )
      .min(1, "At least one item is required"),
    notes: z.string().optional(),
    invoiceCurrency: z.enum(INVOICE_CURRENCIES, {
      required_error: "Please select an invoice currency",
    }),
    paymentCurrency: z.string().min(1, "Payment currency is required"),
    walletAddress: AddressSchema.optional(),
    isRecurring: z.boolean().default(false),
    startDate: z.string().optional(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    isCryptoToFiatAvailable: z.boolean().default(false),
    paymentDetailsId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.startDate) {
        ctx.addIssue({
          code: "custom",
          message: "Start date is required for recurring invoices",
          path: ["startDate"],
        });
      }

      if (!data.frequency) {
        ctx.addIssue({
          code: "custom",
          message: "Frequency is required for recurring invoices",
          path: ["frequency"],
        });
      }
    }

    if (!data.isCryptoToFiatAvailable) {
      if (!data.walletAddress) {
        ctx.addIssue({
          code: "custom",
          message: "Wallet address is required",
          path: ["walletAddress"],
        });
      }
    } else {
      if (!data.paymentDetailsId) {
        ctx.addIssue({
          code: "custom",
          message: "Payment details are required for crypto-to-fiat payments",
          path: ["paymentDetailsId"],
        });
      }
    }

    const dueDate = new Date(data.dueDate).getTime();
    const now = new Date().getTime();
    if (dueDate < now) {
      ctx.addIssue({
        code: "custom",
        message: "Due date must be in future",
        path: ["dueDate"],
      });
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
