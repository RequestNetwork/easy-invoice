import { apiClient } from "@/lib/axios";
import { toTRPCError } from "@/lib/errors";
import { createRecurringPaymentSchema } from "@/lib/schemas/recurring-payment";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { recurringPaymentTable, subscriptionPlanTable } from "../db/schema";
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
  getNonSubscriptionRecurringPayments: protectedProcedure.query(
    async ({ ctx }) => {
      const { db, user } = ctx;

      try {
        const recurringPayments = await db.query.recurringPaymentTable.findMany(
          {
            where: and(
              eq(recurringPaymentTable.userId, user.id),
              isNull(recurringPaymentTable.subscriptionId),
            ),
            orderBy: desc(recurringPaymentTable.createdAt),
          },
        );

        return recurringPayments;
      } catch (error) {
        throw toTRPCError(error);
      }
    },
  ),

  createRecurringPayment: protectedProcedure
    .input(createRecurringPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      try {
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
            payer: input.payer,
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
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  updateRecurringPayment: protectedProcedure
    .input(
      z.object({
        externalPaymentId: z.string().min(1, "ID is required"),
        action: z.enum(["cancel", "unpause"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      try {
        const recurringPayment = await db.query.recurringPaymentTable.findFirst(
          {
            where: and(
              eq(
                recurringPaymentTable.externalPaymentId,
                input.externalPaymentId,
              ),
              eq(recurringPaymentTable.userId, user.id),
            ),
          },
        );

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

        const newStatus = input.action === "cancel" ? "cancelled" : "active";
        await db
          .update(recurringPaymentTable)
          .set({ status: newStatus })
          .where(eq(recurringPaymentTable.id, recurringPayment.id));

        return response.data as UpdateRecurringPaymentResponse;
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  updateRecurringPaymentForSubscription: protectedProcedure
    .input(
      z.object({
        externalPaymentId: z.string().min(1, "External payment ID is required"),
        subscriptionId: z.string().min(1, "Subscription ID is required"),
        action: z.enum(["cancel", "unpause"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      try {
        const subscriptionPlan = await db.query.subscriptionPlanTable.findFirst(
          {
            where: and(
              eq(subscriptionPlanTable.id, input.subscriptionId),
              eq(subscriptionPlanTable.userId, user.id),
            ),
          },
        );

        if (!subscriptionPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription plan not found or access denied",
          });
        }

        const recurringPayment = await db.query.recurringPaymentTable.findFirst(
          {
            where: and(
              eq(recurringPaymentTable.subscriptionId, input.subscriptionId),
              eq(
                recurringPaymentTable.externalPaymentId,
                input.externalPaymentId,
              ),
            ),
          },
        );

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

        const newStatus = input.action === "cancel" ? "cancelled" : "active";
        await db
          .update(recurringPaymentTable)
          .set({ status: newStatus })
          .where(eq(recurringPaymentTable.id, recurringPayment.id));

        return response.data as UpdateRecurringPaymentResponse;
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
