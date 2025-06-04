import { INVOICE_CURRENCIES } from "@/lib/constants/currencies";
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
    walletAddress: z.string().optional(),
    isRecurring: z.boolean().default(false),
    startDate: z.string().optional(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    isCryptoToFiatAvailable: z.boolean().default(false),
    paymentDetailsId: z.string().optional(),
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
  )
  .refine(
    (data) => {
      // Wallet address is required when crypto-to-fiat is not enabled
      if (!data.isCryptoToFiatAvailable) {
        return !!data.walletAddress && isEthereumAddress(data.walletAddress);
      }
      return true;
    },
    {
      message: "Valid wallet address is required for direct crypto payments",
      path: ["walletAddress"],
    },
  )
  .refine(
    (data) => {
      // Payment details are required when crypto-to-fiat is enabled
      if (data.isCryptoToFiatAvailable) {
        return !!data.paymentDetailsId;
      }
      return true;
    },
    {
      message: "Please select a payment method for Crypto-to-fiat payment",
      path: ["paymentDetailsId"],
    },
  );

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
