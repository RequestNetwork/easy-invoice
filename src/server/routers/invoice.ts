import { apiClient } from "@/lib/axios";
import { invoiceFormSchema } from "@/lib/schemas/invoice";
import { requestTable } from "@/server/db/schema";
import { ulid } from "ulid";
import { protectedProcedure, router } from "../trpc";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const invoiceRouter = router({
	create: protectedProcedure
		.input(invoiceFormSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { db } = ctx;

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
						invoiceNumber: input.invoiceNumber,
						items: input.items,
						notes: input.notes,
						userId: ctx.user?.id as string,
					})
					.returning();

				return {
					success: true,
					invoice: invoice[0],
				};
			} catch (error) {
				console.log("Error: ", error);
				return { success: false };
			}
		}),
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const { db } = ctx;
		const invoices = await db.query.requestTable.findMany({
			where: eq(requestTable.userId, ctx.user?.id as string),
		});

		const totalPayments = invoices.reduce(
			(acc, invoice) => acc + Number(invoice.amount),
			0,
		);

		const outstandingInvoices = invoices.filter(
			(invoice) => invoice.status !== "paid",
		);

		return {
			invoices,
			totalPayments,
			outstandingInvoices: outstandingInvoices.length,
		};
	}),
	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const invoice = await db.query.requestTable.findFirst({
				where: eq(requestTable.id, input),
			});
			return invoice;
		}),
	payRequest: protectedProcedure
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
				return { success: false, message: "Failed to pay invoice" };
			}

			return { success: true, data: response.data };
		}),
});
