import { apiClient } from "@/lib/axios";
import {
  batchPaymentFormSchema,
  paymentFormSchema,
} from "@/lib/schemas/payment";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const paymentRouter = router({
  pay: protectedProcedure
    .input(paymentFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to pay",
        });
      }

      const response = await apiClient.post("v2/payouts", {
        amount: input.amount.toString(),
        payee: input.payee,
        invoiceCurrency: input.invoiceCurrency,
        paymentCurrency: input.paymentCurrency,
      });

      if (response.status !== 201) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to pay",
        });
      }

      return response.data;
    }),
  batchPay: protectedProcedure
    .input(
      batchPaymentFormSchema.extend({
        payer: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to pay",
        });
      }

      const reponse = await apiClient.post("v2/payouts/batch", {
        requests: input.payments.map((payment) => ({
          amount: payment.amount.toString(),
          payee: payment.payee,
          invoiceCurrency: payment.invoiceCurrency,
          paymentCurrency: payment.paymentCurrency,
        })),
        payer: input.payer,
      });

      return reponse.data;
    }),
});
