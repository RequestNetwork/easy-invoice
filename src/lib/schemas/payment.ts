import { PAYOUT_CURRENCIES } from "@/lib/constants/currencies";
import { RecurrenceFrequency } from "@/server/db/schema";
import { isEthereumAddress } from "validator";
import { z } from "zod";

export const paymentApiSchema = z.object({
  payee: z
    .string()
    .min(1, "Recipient address is required")
    .refine(isEthereumAddress, "Invalid Ethereum address format"),
  amount: z.number().gt(0, "Amount must be greater than 0"),
  invoiceCurrency: z.enum(PAYOUT_CURRENCIES, {
    required_error: "Please select an invoice currency",
  }),
  paymentCurrency: z.string().min(1, "Payment currency is required"),
  recurrence: z
    .object({
      startDate: z.coerce
        .date()
        .describe("The start date of the payment, cannot be in the past")
        .refine(
          (date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to start of day
            return date >= today;
          },
          { message: "Start date cannot be in the past" },
        ),
      frequency: z
        .enum(RecurrenceFrequency)
        .describe("The frequency of the payment"),
      totalPayments: z
        .number()
        .min(2, "Must have at least 2 executions for recurring payments")
        .max(256, "Cannot exceed 256 executions (contract limit)")
        .describe(
          "The total number of times the payment will be executed (max 256).",
        ),
      payer: z
        .string()
        .refine(isEthereumAddress, {
          message: "Invalid Ethereum address",
        })
        .describe("The wallet address of the payer"),
    })
    .optional(),
  payerWallet: z
    .string()
    .refine(isEthereumAddress, "Invalid Ethereum wallet address")
    .optional()
    .describe("The connect wallet address of the payer"),
});

export type PaymentAPIValues = z.infer<typeof paymentApiSchema>;

export const payoutSchema = paymentApiSchema.omit({
  recurrence: true,
});

export const batchPaymentApiSchema = z
  .object({
    payouts: z
      .array(payoutSchema)
      .min(1, "At least one payment is required")
      .max(10, "Maximum 10 payments allowed")
      .optional(),
    requestIds: z.array(z.string()).optional(),
    payer: z.string().optional(),
  })
  .refine((data) => data.payouts || data.requestIds, {
    message: "Either payouts or requestIds must be provided",
  });
