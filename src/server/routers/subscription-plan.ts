import { subscriptionPlanApiSchema } from "@/lib/schemas/subscription-plan";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { subscriptionPlanTable } from "../db/schema";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const subscriptionPlanRouter = router({
  create: protectedProcedure
    .input(subscriptionPlanApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create an invoice me link",
        });
      }

      await db.insert(subscriptionPlanTable).values({
        id: ulid(),
        label: input.label,
        userId: user.id,
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

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to get your subscribe to me links",
      });
    }

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

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete an invoice me link",
        });
      }

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
});
