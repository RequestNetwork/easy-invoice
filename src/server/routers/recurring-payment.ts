import { apiClient } from "@/lib/axios";
import { recurringPaymentAPISchema } from "@/lib/schemas/recurring-payment";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { recurringPaymentTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const recurringPaymentRouter = router({
  getRecurringRequests: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    // Probably not happening, but let's make TS happy
    if (!user || !user.id) {
      throw new Error("User not authenticated");
    }
    const recurringRequests = await db.query.recurringPaymentTable.findMany({
      where: and(eq(recurringPaymentTable.userId, user.id)),
      orderBy: desc(recurringPaymentTable.createdAt),
    });

    return recurringRequests;
  }),
  // TODO should somehow unify it with the payment router
  payRecurring: protectedProcedure
    .input(recurringPaymentAPISchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create recurring payments",
        });
      }

      const feePercentage = process.env.FEE_PERCENTAGE_FOR_PAYMENT;
      const feeAddress = process.env.FEE_ADDRESS_FOR_PAYMENT;

      const response = await apiClient.post("v2/payouts", {
        amount: input.amount.toString(),
        payee: input.payee,
        invoiceCurrency: input.invoiceCurrency,
        paymentCurrency: input.paymentCurrency,
        recurrence: input.recurrence,
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
          message: "Failed to create recurring payment",
        });
      }

      return response.data;
    }),
});
