import { and, desc, eq } from "drizzle-orm";
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
});
