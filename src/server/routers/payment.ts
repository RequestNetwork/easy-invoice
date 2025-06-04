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
      z.object({
        payouts: batchPaymentFormSchema.shape.payouts.optional(),
        requestIds: z.array(z.string()).optional(),
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

      const response = await apiClient.post("v2/payouts/batch", {
        requests: input.payouts
          ? input.payouts.map((payout) => ({
              amount: payout.amount.toString(),
              payee: payout.payee,
              invoiceCurrency: payout.invoiceCurrency,
              paymentCurrency: payout.paymentCurrency,
            }))
          : undefined,
        requestIds: input.requestIds,
        payer: input.payer,
      });

      return response.data;
    }),
});
