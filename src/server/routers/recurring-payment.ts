import { and, desc, eq } from "drizzle-orm";
import { recurringPaymentTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const recurringPaymentRouter = router({
  getRecurringRequests: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    const recurringRequests = await db.query.recurringPaymentTable.findMany({
      where: and(eq(recurringPaymentTable.userId, user?.id as string)),
      orderBy: desc(recurringPaymentTable.createdAt),
    });

    return recurringRequests;
  }),
});
