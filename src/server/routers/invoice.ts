import { apiClient } from "@/lib/axios";
import { invoiceFormSchema } from "@/lib/schemas/invoice";
import {
  type PaymentDetailsPayers,
  requestTable,
  userTable,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, not, or } from "drizzle-orm";
import { ulid } from "ulid";
import { isEthereumAddress } from "validator";
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

  // FIXME: This logic can be removed after we implement it inside the Request Network API.
  // We set the payee address to an address controlled by the Request Network Foundation,
  // even in the case of crypto-to-fiat, because it's required by the protocol.
  // This ensures that funds can be recovered if the payer chooses to bypass the Request Network API
  // and use the Request Network SDK directly (which doesn't handle Crypto-to-fiat correctly).
  const payee = input.isCryptoToFiatAvailable
    ? process.env.CRYPTO_TO_FIAT_PAYEE_ADDRESS ||
      (() => {
        console.error(
          "CRYPTO_TO_FIAT_PAYEE_ADDRESS environment variable is not set",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Server configuration error: Crypto to fiat payments are not properly configured",
        });
      })()
    : input.walletAddress;

  const response = await apiClient.post("/v2/request", {
    amount: totalAmount.toString(),
    payee,
    invoiceCurrency: input.invoiceCurrency,
    paymentCurrency: input.paymentCurrency,
    isCryptoToFiatAvailable: input.isCryptoToFiatAvailable,
    ...(input.isRecurring && {
      recurrence: {
        startDate: input.startDate,
        frequency: input.frequency,
      },
    }),
  });

  if (response.status !== 200) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to create invoice: ${response.data.message}`,
    });
  }

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
      payee,
      dueDate: new Date(input.dueDate).toISOString(),
      requestId: response.data.requestId as string,
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
      recurrence: input.isRecurring
        ? {
            startDate: input.startDate,
            frequency: input.frequency,
          }
        : null,
      isCryptoToFiatAvailable: input.isCryptoToFiatAvailable,
      paymentDetailsId: input.paymentDetailsId,
    })
    .returning();

  if (!invoice[0]) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create invoice",
    });
  }

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
        console.error("[invoice.create] Failed to create invoice", {
          userId: user?.id,
          clientEmail: input.clientEmail,
          invoiceNumber: input.invoiceNumber,
          error: error instanceof Error ? error.message : error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invoice",
        });
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
          return createInvoiceHelper(
            tx,
            {
              ...input,
            },
            input.invoicedTo as string,
          );
        });
      } catch (error) {
        console.error(
          "[invoice.createFromInvoiceMe] Failed to create invoice",
          {
            invoicedTo: input.invoicedTo,
            clientEmail: input.clientEmail,
            invoiceNumber: input.invoiceNumber,
            error: error instanceof Error ? error.message : error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invoice",
        });
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
    .input(
      z.object({
        requestId: z.string(),
        wallet: z.string().optional(),
        chain: z.string().optional(),
        token: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // Get the request with its payment details
      const invoice = await db.query.requestTable.findFirst({
        where: eq(requestTable.requestId, input.requestId),
        with: {
          paymentDetails: {
            with: {
              payers: {
                with: {
                  payer: true,
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        return { success: false, message: "Invoice not found" };
      }

      let paymentDetailsPayers: PaymentDetailsPayers | undefined;
      if (invoice.paymentDetails) {
        if (
          !invoice.paymentDetails.payers ||
          invoice.paymentDetails.payers.length === 0
        ) {
          return { success: false, message: "No payment details payers found" };
        }

        const paymentDetailsPayers = invoice.paymentDetails?.payers.find(
          (payer) => payer.payer.email === invoice.clientEmail,
        );
        if (!paymentDetailsPayers) {
          return { success: false, message: "Payment details not found" };
        }
      }

      let paymentEndpoint = `/v2/request/${invoice.requestId}/pay?wallet=${input.wallet}&clientUserId=${invoice.clientEmail}${paymentDetailsPayers ? `&paymentDetailsId=${paymentDetailsPayers?.externalPaymentDetailId}` : ""}`;

      if (input.chain) {
        paymentEndpoint += `&chain=${input.chain}`;
      }

      if (input.token) {
        paymentEndpoint += `&token=${input.token}`;
      }

      const response = await apiClient.get(paymentEndpoint);

      if (response.status !== 200) {
        return {
          success: false,
          message: "Failed to get payment transactions calldata",
        };
      }

      return { success: true, data: response.data };
    }),
  stopRecurrence: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { requestId } = input;

      const request = await apiClient.patch(
        `/v2/request/${requestId}/stop-recurrence`,
      );

      if (request.status !== 200) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to stop recurrence",
        });
      }
      const updatedInvoice = await ctx.db
        .update(requestTable)
        .set({
          isRecurrenceStopped: true,
        })
        .where(eq(requestTable.requestId, requestId))
        .returning();

      if (!updatedInvoice.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice with this payment reference not found",
        });
      }

      return updatedInvoice[0];
    }),
  getPaymentRoutes: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        walletAddress: z.string().refine(
          (val) => {
            return isEthereumAddress(val);
          },
          {
            message: "Invalid wallet address",
          },
        ),
      }),
    )
    .query(async ({ input }) => {
      const { requestId, walletAddress } = input;

      const response = await apiClient.get(
        `/v2/request/${requestId}/routes?wallet=${walletAddress}`,
      );

      if (response.status !== 200) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to get payment routes",
        });
      }

      return response.data.routes;
    }),
  sendPaymentIntent: publicProcedure
    .input(
      z.object({
        paymentIntent: z.string(),
        payload: z.any(),
      }),
    )
    .mutation(async ({ input }) => {
      const { paymentIntent, payload } = input;

      const response = await apiClient.post(
        `/v2/request/${paymentIntent}/send`,
        payload,
      );

      return response.data;
    }),
});
