import { createRecurringPaymentSchema } from "@/lib/schemas/recurring-payment";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";
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

  createRecurringPayment: protectedProcedure
    .input(createRecurringPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      if (!user || !user.id) {
        throw new Error("User not authenticated");
      }

      const recurringPayment = await db
        .insert(recurringPaymentTable)
        .values({
          id: ulid(),
          externalPaymentId: input.externalPaymentId,
          status: "pending",
          totalAmountPerMonth: input.amount.toString(),
          paymentCurrency: input.paymentCurrency,
          chain: input.chain,
          totalNumberOfPayments: input.totalExecutions,
          currentNumberOfPayments: 0,
          userId: user.id,
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
});
