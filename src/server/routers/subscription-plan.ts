import { subscriptionPlanApiSchema } from "@/lib/schemas/subscription-plan";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNotNull, not } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { recurringPaymentTable, subscriptionPlanTable } from "../db/schema";
import { protectedProcedure, publicProcedure, router } from "../trpc";

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
        where: eq(subscriptionPlanTable.userId, user.id),
        orderBy: desc(subscriptionPlanTable.createdAt),
      },
    );

    return subscriptionPlanLinks;
  }),
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      await db
        .delete(subscriptionPlanTable)
        .where(
          and(
            eq(subscriptionPlanTable.id, input),
            eq(subscriptionPlanTable.userId, user.id),
          ),
        );
    }),
  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const { db } = ctx;

    const subscriptionPlanLink = await db.query.subscriptionPlanTable.findFirst(
      {
        where: eq(subscriptionPlanTable.id, input),
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              id: true,
            },
          },
        },
      },
    );

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
      where: eq(subscriptionPlanTable.userId, user.id),
      orderBy: desc(subscriptionPlanTable.createdAt),
    });

    const allPlanIds = subscriptionPlans.map((plan) => plan.id);

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
  getSubscribersForPlan: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx;

      const subscriptionPlan = await db.query.subscriptionPlanTable.findFirst({
        where: and(
          eq(subscriptionPlanTable.id, input),
          eq(subscriptionPlanTable.userId, user.id),
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
