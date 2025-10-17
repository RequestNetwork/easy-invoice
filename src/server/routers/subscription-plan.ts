import { toTRPCError } from "@/lib/errors";
import { subscriptionPlanApiSchema } from "@/lib/schemas/subscription-plan";
import type { SubscriptionPayment } from "@/lib/types";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNotNull, not } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { recurringPaymentTable, subscriptionPlanTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const subscriptionPlanRouter = router({
  create: protectedProcedure
    .input(subscriptionPlanApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      try {
        await db.insert(subscriptionPlanTable).values({
          id: ulid(),
          label: input.label,
          userId: user.id,
          trialDays: input.trialDays ?? 0,
          chain: input.chain,
          amount: input.amount.toString(),
          totalNumberOfPayments: input.totalPayments,
          paymentCurrency: input.paymentCurrency,
          recurrenceFrequency: input.frequency,
          recipient: input.payee,
        });
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    try {
      const subscriptionPlanLinks =
        await db.query.subscriptionPlanTable.findMany({
          where: and(
            eq(subscriptionPlanTable.userId, user.id),
            eq(subscriptionPlanTable.active, true),
          ),
          orderBy: desc(subscriptionPlanTable.createdAt),
        });

      return subscriptionPlanLinks;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      try {
        // Set the plan to inactive instead of deleting it
        await db
          .update(subscriptionPlanTable)
          .set({ active: false })
          .where(
            and(
              eq(subscriptionPlanTable.id, input),
              eq(subscriptionPlanTable.userId, user.id),
            ),
          );
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        const subscriptionPlanLink =
          await db.query.subscriptionPlanTable.findFirst({
            where: and(
              eq(subscriptionPlanTable.id, input),
              eq(subscriptionPlanTable.active, true),
            ),
            with: {
              user: {
                columns: {
                  name: true,
                  email: true,
                  id: true,
                },
              },
            },
          });

        if (!subscriptionPlanLink) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription plan link not found",
          });
        }

        return subscriptionPlanLink;
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getAllSubscribers: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    try {
      const subscriptionPlans = await db.query.subscriptionPlanTable.findMany({
        where: and(
          eq(subscriptionPlanTable.userId, user.id),
          eq(subscriptionPlanTable.active, true),
        ),
        orderBy: desc(subscriptionPlanTable.createdAt),
      });

      const allPlanIds = subscriptionPlans.map((plan) => plan.id);

      if (allPlanIds.length === 0) {
        return [];
      }

      const subscribers = await db.query.recurringPaymentTable.findMany({
        where: and(
          inArray(recurringPaymentTable.subscriptionId, allPlanIds),
          not(eq(recurringPaymentTable.status, "cancelled")),
        ),
        orderBy: desc(recurringPaymentTable.createdAt),
        with: {
          subscription: {
            columns: {
              id: true,
              label: true,
              trialDays: true,
            },
          },
        },
      });

      return subscribers;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  getAllPayments: protectedProcedure.query(
    async ({ ctx }): Promise<SubscriptionPayment[]> => {
      const { db, user } = ctx;

      try {
        const subscriptionPlans = await db.query.subscriptionPlanTable.findMany(
          {
            where: and(
              eq(subscriptionPlanTable.userId, user.id),
              eq(subscriptionPlanTable.active, true),
            ),
            orderBy: desc(subscriptionPlanTable.createdAt),
          },
        );

        const allPlanIds = subscriptionPlans.map((plan) => plan.id);

        if (allPlanIds.length === 0) {
          return [];
        }

        const subscribers = await db.query.recurringPaymentTable.findMany({
          where: and(
            inArray(recurringPaymentTable.subscriptionId, allPlanIds),
            not(eq(recurringPaymentTable.status, "cancelled")),
          ),
          orderBy: desc(recurringPaymentTable.createdAt),
          with: {
            subscription: {
              columns: {
                id: true,
                label: true,
                trialDays: true,
                totalNumberOfPayments: true,
              },
            },
          },
        });

        return subscribers.reduce<SubscriptionPayment[]>((acc, subscriber) => {
          if (subscriber.payments && subscriber.payments.length > 0) {
            subscriber.payments.forEach((payment, index) => {
              acc.push({
                id: `${subscriber.id}-${payment.txHash}`,
                amount: subscriber.totalAmount,
                currency: subscriber.paymentCurrency,
                planId: subscriber.subscriptionId || "no-plan",
                planName: subscriber.subscription?.label || "Unnamed Plan",
                totalNumberOfPayments:
                  subscriber.subscription?.totalNumberOfPayments || 0,
                paymentNumber: index + 1,
                txHash: payment.txHash,
                createdAt: new Date(payment.date),
                requestScanUrl: payment.requestScanUrl,
                chain: subscriber.chain,
                subscriber: subscriber.payer,
                conversionInfo: payment.conversionInfo ?? null,
              });
            });
          }
          return acc;
        }, []);
      } catch (error) {
        throw toTRPCError(error);
      }
    },
  ),
  getSubscribersForPlan: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx;

      try {
        const subscriptionPlan = await db.query.subscriptionPlanTable.findFirst(
          {
            where: and(
              eq(subscriptionPlanTable.id, input),
              eq(subscriptionPlanTable.userId, user.id),
              eq(subscriptionPlanTable.active, true),
            ),
          },
        );

        if (!subscriptionPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription plan not found",
          });
        }

        const subscribers = await db.query.recurringPaymentTable.findMany({
          where: and(
            eq(recurringPaymentTable.subscriptionId, input),
            not(eq(recurringPaymentTable.status, "cancelled")),
          ),
          orderBy: desc(recurringPaymentTable.createdAt),
          with: {
            user: {
              columns: {
                name: true,
                email: true,
                id: true,
              },
            },
          },
        });

        return subscribers;
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getUserActiveSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    try {
      const userSubscriptions = await db.query.recurringPaymentTable.findMany({
        where: and(
          eq(recurringPaymentTable.userId, user.id),
          isNotNull(recurringPaymentTable.subscriptionId),
        ),
        orderBy: desc(recurringPaymentTable.createdAt),
        with: {
          subscription: {
            columns: {
              id: true,
              label: true,
              trialDays: true,
            },
          },
        },
      });

      return userSubscriptions;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
