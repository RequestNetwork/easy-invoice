import { apiClient } from "@/lib/axios";
import { serverEnv } from "@/lib/env/server";
import { toTRPCError } from "@/lib/errors";
import { batchPaymentApiSchema, paymentApiSchema } from "@/lib/schemas/payment";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const paymentRouter = router({
  pay: protectedProcedure
    .input(paymentApiSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { user } = ctx;

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to pay",
          });
        }

        const feePercentage = serverEnv.FEE_PERCENTAGE_FOR_PAYMENT;
        const feeAddress = serverEnv.FEE_ADDRESS_FOR_PAYMENT;

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

        return response.data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw toTRPCError(error);
      }
    }),
  batchPay: protectedProcedure
    .input(batchPaymentApiSchema)
    .mutation(async ({ ctx, input }) => {
      try {
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
                feePercentage: serverEnv.FEE_PERCENTAGE_FOR_PAYMENT,
                feeAddress: serverEnv.FEE_ADDRESS_FOR_PAYMENT,
              }))
            : undefined,
          requestIds: input.requestIds,
          payer: input.payer,
        });

        return response.data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw toTRPCError(error);
      }
    }),
  submitRecurringSignature: protectedProcedure
    .input(
      z.object({
        recurringPaymentId: z
          .string()
          .min(1, "Recurring payment ID is required"),
        permitSignature: z.string().min(1, "Permit signature is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit signature",
        });
      }

      try {
        const response = await apiClient.post(
          `v2/payouts/recurring/${input.recurringPaymentId}`,
          { permitSignature: input.permitSignature },
        );

        return response.data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw toTRPCError(error);
      }
    }),
});
