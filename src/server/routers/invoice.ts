import { apiClient } from "@/lib/axios";
import { invoiceFormSchema } from "@/lib/schemas/invoice";
import { requestTable, userTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, not, or } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const createInvoiceHelper = async (
  db: any,
  input: z.infer<typeof invoiceFormSchema>,
  userId: string,
) => {
  const totalAmount = input.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const response = await apiClient.post("/v1/request", {
    amount: totalAmount.toString(),
    payee: input.walletAddress,
    invoiceCurrency: input.invoiceCurrency,
    paymentCurrency: input.paymentCurrency,
  });

  const invoice = await db
    .insert(requestTable)
    .values({
      id: ulid(),
      issuedDate: new Date().toISOString(),
      amount: totalAmount.toString(),
      invoiceCurrency: input.invoiceCurrency,
      paymentCurrency: input.paymentCurrency,
      type: "invoice",
      status: "pending",
      payee: input.walletAddress,
      dueDate: new Date(input.dueDate).toISOString(),
      requestId: response.data.requestID as string,
      paymentReference: response.data.paymentReference as string,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      creatorName: input.creatorName,
      creatorEmail: input.creatorEmail,
      invoiceNumber: input.invoiceNumber,
      items: input.items,
      notes: input.notes,
      userId: userId,
      invoicedTo: input.invoicedTo || null,
    })
    .returning();

  return {
    success: true,
    invoice: invoice[0],
  };
};

export const invoiceRouter = router({
  // Protected route for regular invoice creation
  create: protectedProcedure
    .input(invoiceFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create an invoice",
        });
      }

      // Check if client email exists as a user
      const clientUser = await db.query.userTable.findFirst({
        where: eq(userTable.email, input.clientEmail),
      });

      try {
        return await db.transaction(async (tx) => {
          return createInvoiceHelper(
            tx,
            {
              ...input,
              invoicedTo: clientUser?.id ?? undefined,
            },
            user.id,
          );
        });
      } catch (error) {
        console.error("Error: ", error);
        return { success: false };
      }
    }),

  // Public route for invoice-me creation
  createFromInvoiceMe: publicProcedure
    .input(invoiceFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      if (!input.invoicedTo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice recipient ID is required",
        });
      }

      // Verify the invoicedTo user exists
      const recipient = await db.query.userTable.findFirst({
        where: eq(userTable.id, input.invoicedTo),
      });

      if (!recipient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice recipient not found",
        });
      }

      try {
        return await db.transaction(async (tx) => {
          // For invoice-me, the userId is the same as invoicedTo
          return createInvoiceHelper(tx, input, input.invoicedTo as string);
        });
      } catch (error) {
        console.error("Error: ", error);
        return { success: false };
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    // Get invoices to receive (issued by me)
    const receivables = await db.query.requestTable.findMany({
      where: and(
        eq(requestTable.userId, user?.id as string),
        or(
          isNull(requestTable.invoicedTo),
          not(eq(requestTable.invoicedTo, user?.id as string)),
        ),
      ),
      orderBy: desc(requestTable.createdAt),
    });

    // Get invoices to pay (issued to me)
    const payables = await db.query.requestTable.findMany({
      where: eq(requestTable.invoicedTo, user?.id as string),
      orderBy: desc(requestTable.createdAt),
    });

    return {
      issuedByMe: {
        invoices: receivables,
        total: receivables.reduce((acc, inv) => acc + Number(inv.amount), 0),
        outstanding: receivables.filter((inv) => inv.status !== "paid").length,
      },
      issuedToMe: {
        invoices: payables,
        total: payables.reduce((acc, inv) => acc + Number(inv.amount), 0),
        outstanding: payables.filter((inv) => inv.status !== "paid").length,
      },
    };
  }),
  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const { db } = ctx;
    const invoice = await db.query.requestTable.findFirst({
      where: eq(requestTable.id, input),
    });

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invoice not found",
      });
    }

    return invoice;
  }),
  payRequest: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const invoice = await db.query.requestTable.findFirst({
        where: eq(requestTable.paymentReference, input),
      });

      if (!invoice) {
        return { success: false, message: "Invoice not found" };
      }

      const response = await apiClient.get(
        `/v1/request/${invoice.paymentReference}/pay`,
      );

      if (response.status !== 200) {
        return {
          success: false,
          message: "Failed to get payment transactions calldata",
        };
      }

      return { success: true, data: response.data };
    }),
});
