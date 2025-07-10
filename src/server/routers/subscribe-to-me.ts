import { subscribeToMeApiSchema } from "@/lib/schemas/subscribe-to-me";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { subscribeToMeTable } from "../db/schema";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const subscribeToMeRouter = router({
  create: protectedProcedure
    .input(subscribeToMeApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create an invoice me link",
        });
      }

      await db.insert(subscribeToMeTable).values({
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

    const subscribeToMeLinks = await db.query.subscribeToMeTable.findMany({
      where: eq(subscribeToMeTable.userId, user.id),
      orderBy: desc(subscribeToMeTable.createdAt),
    });

    return subscribeToMeLinks;
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
        .delete(subscribeToMeTable)
        .where(
          and(
            eq(subscribeToMeTable.id, input),
            eq(subscribeToMeTable.userId, user.id),
          ),
        );
    }),
  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const { db } = ctx;

    const subscribeToMeLink = await db.query.subscribeToMeTable.findFirst({
      where: eq(subscribeToMeTable.id, input),
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

    if (!subscribeToMeLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscribe to me link not found",
      });
    }

    return subscribeToMeLink;
  }),
});
