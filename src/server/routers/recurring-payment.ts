import { apiClient } from "@/lib/axios";
import { createRecurringPaymentSchema } from "@/lib/schemas/recurring-payment";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { RecurringPaymentStatus, recurringPaymentTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

// Response type for the external API
type UpdateRecurringPaymentResponse = {
  id: string;
  status: string;
  transactions: any[];
  metadata: {
    remainingPayments: number;
    remainingPaymentsAmount: string;
    processedPayments: number;
    totalPayments: number;
  };
};

export const recurringPaymentRouter = router({
  getRecurringPayments: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    const recurringPayments = await db.query.recurringPaymentTable.findMany({
      where: and(eq(recurringPaymentTable.userId, user.id)),
      orderBy: desc(recurringPaymentTable.createdAt),
    });

    return recurringPayments;
  }),

  createRecurringPayment: protectedProcedure
    .input(createRecurringPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      const recurringPayment = await db
        .insert(recurringPaymentTable)
        .values({
          id: ulid(),
          externalPaymentId: input.externalPaymentId,
          status: "pending",
          totalAmount: input.amount.toString(),
          paymentCurrency: input.paymentCurrency,
          chain: input.chain,
          totalNumberOfPayments: input.totalPayments,
          currentNumberOfPayments: 0,
          userId: user.id,
          subscriptionId: input.subscriptionId,
          recurrence: {
            startDate: input.startDate,
            frequency: input.frequency,
          },
          recipient: {
            address: input.payee,
            amount: input.amount.toString(),
          },
          payments: [],
        })
        .returning();

      return recurringPayment[0];
    }),

  setRecurringPaymentStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, "ID is required"),
        status: z.enum(RecurringPaymentStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      const recurringPayment = await db.query.recurringPaymentTable.findFirst({
        where: and(
          eq(recurringPaymentTable.id, input.id),
          eq(recurringPaymentTable.userId, user.id),
        ),
      });

      if (!recurringPayment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring payment not found",
        });
      }

      await db
        .update(recurringPaymentTable)
        .set({ status: input.status })
        .where(eq(recurringPaymentTable.id, input.id));

      return;
    }),
  updateRecurringPayment: protectedProcedure
    .input(
      z.object({
        externalPaymentId: z.string().min(1, "ID is required"), // Note that this is the external ID
        action: z.enum(["cancel", "unpause"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      const recurringPayment = await db.query.recurringPaymentTable.findFirst({
        where: and(
          eq(recurringPaymentTable.externalPaymentId, input.externalPaymentId),
          eq(recurringPaymentTable.userId, user.id),
        ),
      });

      if (!recurringPayment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring payment not found",
        });
      }

      const response = await apiClient.patch(
        `v2/payouts/recurring/${input.externalPaymentId}`,
        {
          action: input.action,
        },
      );

      if (response.status !== 200) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update recurring payment",
        });
      }

      return response.data as UpdateRecurringPaymentResponse;
    }),
});
