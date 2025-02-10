import { CURRENCY_VALUE } from "@/lib/currency";
import { invoiceFormSchema } from "@/lib/schemas/invoice";
import { requestTable } from "@/server/db/schema";
import { ethers } from "ethers";
import { protectedProcedure, router } from "../trpc";
import { ulid } from "ulid";

export const invoiceRouter = router({
	create: protectedProcedure
		.input(invoiceFormSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { user, db } = ctx;

				const totalAmount = input.items.reduce(
					(acc, item) => acc + item.price * item.quantity,
					0,
				);

				await db.insert(requestTable).values({
					id: ulid(),
					amount: totalAmount.toString(),
					currency: input.cryptocurrency,
					type: "invoice",
					status: "pending",
					payer: input.clientWallet,
					payee: input.walletAddress,
					dueDate: new Date(input.dueDate).toISOString(),
					requestId: ulid(),
					paymentReference: ulid(),
					clientName: input.clientName,
					clientEmail: input.clientEmail,
					invoiceNumber: input.invoiceNumber,
					items: input.items,
					notes: input.notes,
				});

				return { success: true };
			} catch (error) {
				console.log("Error: ", error);
				return { success: false };
			}
		}),
});
