import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { invoiceMeTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const invoiceMeRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        label: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create an invoice me link",
        });
      }

      await db.insert(invoiceMeTable).values({
        id: ulid(),
        label: input.label,
        userId: user.id,
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to get your invoice me links",
      });
    }

    const invoiceMeLinks = await db.query.invoiceMeTable.findMany({
      where: eq(invoiceMeTable.userId, user.id),
      orderBy: desc(invoiceMeTable.createdAt),
    });

    return invoiceMeLinks;
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
        .delete(invoiceMeTable)
        .where(
          and(eq(invoiceMeTable.id, input), eq(invoiceMeTable.userId, user.id)),
        );
    }),
});
