import { INVOICE_CURRENCIES } from "@/lib/currencies";
import { isEthereumAddress } from "validator";
import { z } from "zod";

export const paymentFormSchema = z.object({
  payee: z
    .string()
    .min(1, "Recipient address is required")
    .refine(isEthereumAddress, "Invalid Ethereum address format"),
  amount: z.number().gt(0, "Amount must be greater than 0"),
  invoiceCurrency: z.enum(INVOICE_CURRENCIES, {
    required_error: "Please select an invoice currency",
  }),
  paymentCurrency: z.string().min(1, "Payment currency is required"),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
