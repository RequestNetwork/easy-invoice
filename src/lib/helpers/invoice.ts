import { db } from "@/server/db";
import { requestTable } from "@/server/db/schema";
import { and, count, eq, gte } from "drizzle-orm";

export const getInvoiceCount = async (userId: string) => {
  const invoicesCountThisMonth = await db
    .select({
      count: count(),
    })
    .from(requestTable)
    .where(
      and(
        eq(requestTable.userId, userId),
        gte(
          requestTable.createdAt,
          new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        ),
      ),
    );

  const invoiceCount = String(invoicesCountThisMonth[0].count + 1).padStart(
    4,
    "0",
  );

  return invoiceCount;
};
