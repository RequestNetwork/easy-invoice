import { apiClient } from "@/lib/axios";
import { paymentFormSchema } from "@/lib/schemas/payment";
import { TRPCError } from "@trpc/server";
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

      const response = await apiClient.post("v2/pay", {
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
});
