import { z } from "zod";
import { paymentApiSchema } from "./payment";

const basePaymentSchema = paymentApiSchema.omit({
  recurrence: true,
});

const recurrenceFields = paymentApiSchema.shape.recurrence.unwrap().shape;

export const createRecurringPaymentSchema = basePaymentSchema
  .extend({
    // Flatten recurrence fields to top level and make them required
    startDate: recurrenceFields.startDate,
    frequency: recurrenceFields.frequency,
    totalPayments: recurrenceFields.totalPayments,
    payer: recurrenceFields.payer,
  })
  .extend({
    chain: z
      .string()
      .min(1, "Chain is required")
      .describe("The blockchain network"),
    externalPaymentId: z
      .string()
      .min(1, "External payment ID is required")
      .describe("The external payment system ID"),
    subscriptionId: z
      .string()
      .optional()
      .describe("Optional subscription ID for linking to a subscription plan"),
  });

export type CreateRecurringPaymentValues = z.infer<
  typeof createRecurringPaymentSchema
>;
