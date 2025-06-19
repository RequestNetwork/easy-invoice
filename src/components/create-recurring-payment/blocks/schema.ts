import { paymentFormSchema } from "@/lib/schemas/payment";
import { recurringPaymentAPISchema } from "@/lib/schemas/recurring-payment";
import type { z } from "zod";

export const recurringPaymentFormSchema = paymentFormSchema.merge(
  recurringPaymentAPISchema
    .pick({
      recurrence: true,
    })
    .shape.recurrence.omit({
      payer: true,
    }),
);

export type RecurringPaymentFormValues = z.infer<
  typeof recurringPaymentFormSchema
>;
