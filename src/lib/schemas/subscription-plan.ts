import { isEthereumAddress } from "validator";
import { z } from "zod";
import { paymentApiSchema } from "./payment";

const recurrenceFields = paymentApiSchema.shape.recurrence.unwrap().shape;

export const subscriptionPlanApiSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.number().gt(0, "Amount must be greater than 0"),
  payee: z
    .string()
    .min(1, "Recipient address is required")
    .refine(isEthereumAddress, "Invalid Ethereum address format"),
  paymentCurrency: z.string().min(1, "Payment currency is required"),
  chain: z
    .string()
    .min(1, "Chain is required")
    .describe("The blockchain network"),
  frequency: recurrenceFields.frequency,
  totalPayments: recurrenceFields.totalPayments,
});
