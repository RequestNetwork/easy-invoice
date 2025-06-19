import { RecurrenceFrequency } from "@/server/db/schema";
import { isEthereumAddress } from "validator";
import { z } from "zod";
import { paymentFormSchema } from "./payment";

export const recurringPaymentAPISchema = paymentFormSchema.extend({
  recurrence: z.object({
    startDate: z.coerce
      .date()
      .describe("The start date of the payment, cannot be in the past")
      .refine(
        (date) => {
          const today = new Date();
          return (
            date.getFullYear() > today.getFullYear() ||
            (date.getFullYear() === today.getFullYear() &&
              (date.getMonth() > today.getMonth() ||
                (date.getMonth() === today.getMonth() &&
                  date.getDate() >= today.getDate())))
          );
        },
        {
          message: "Start date cannot be in the past",
        },
      ),
    frequency: z
      .enum(RecurrenceFrequency)
      .describe("The frequency of the payment"),
    totalExecutions: z
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
  }),
});

export type RecurringPaymentAPIValues = z.infer<
  typeof recurringPaymentAPISchema
>;
