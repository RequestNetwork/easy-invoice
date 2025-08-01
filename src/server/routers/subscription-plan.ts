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
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    const subscriptionPlanLinks = await db.query.subscriptionPlanTable.findMany(
      {
        where: and(
          eq(subscriptionPlanTable.userId, user.id),
          eq(subscriptionPlanTable.active, true),
        ),
        orderBy: desc(subscriptionPlanTable.createdAt),
      },
    );

    return subscriptionPlanLinks;
  }),
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

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
    }),
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { db } = ctx;

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
    }),
  getAllSubscribers: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

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
  }),
  getAllPayments: protectedProcedure.query(
    async ({ ctx }): Promise<SubscriptionPayment[]> => {
      const { db, user } = ctx;

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

      return subscribers.reduce<SubscriptionPayment[]>((acc, subscriber) => {
        if (subscriber.payments && subscriber.payments.length > 0) {
          for (const payment of subscriber.payments) {
            acc.push({
              id: `${subscriber.id}-${payment.txHash}`,
              amount: subscriber.totalAmount,
              currency: subscriber.paymentCurrency,
              planId: subscriber.subscriptionId || "no-plan",
              planName: subscriber.subscription?.label || "Unnamed Plan",
              txHash: payment.txHash,
              createdAt: new Date(payment.date),
              requestScanUrl: payment.requestScanUrl,
              chain: subscriber.chain,
              subscriber: subscriber.payer,
            });
          }
        }
        return acc;
      }, []);
    },
  ),
  getSubscribersForPlan: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx;

      const subscriptionPlan = await db.query.subscriptionPlanTable.findFirst({
        where: and(
          eq(subscriptionPlanTable.id, input),
          eq(subscriptionPlanTable.userId, user.id),
          eq(subscriptionPlanTable.active, true),
        ),
      });

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
    }),
  getUserActiveSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

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
  }),
});
