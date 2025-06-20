import { apiClient } from "@/lib/axios";
import { batchPaymentApiSchema, paymentApiSchema } from "@/lib/schemas/payment";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";

export const paymentRouter = router({
  pay: protectedProcedure
    .input(paymentApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to pay",
        });
      }

      const feePercentage = process.env.FEE_PERCENTAGE_FOR_PAYMENT;
      const feeAddress = process.env.FEE_ADDRESS_FOR_PAYMENT;

      const response = await apiClient.post("v2/payouts", {
        amount: input.amount.toString(),
        payee: input.payee,
        invoiceCurrency: input.invoiceCurrency,
        paymentCurrency: input.paymentCurrency,
        recurrence: input.recurrence ?? undefined,
        ...(feePercentage && feeAddress
          ? {
              feePercentage: feePercentage,
              feeAddress: feeAddress,
            }
          : {}),
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
    .input(batchPaymentApiSchema)
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
              feePercentage: process.env.FEE_PERCENTAGE_FOR_PAYMENT,
              feeAddress: process.env.FEE_ADDRESS_FOR_PAYMENT,
            }))
          : undefined,
        requestIds: input.requestIds,
        payer: input.payer,
      });

      return response.data;
    }),
});
