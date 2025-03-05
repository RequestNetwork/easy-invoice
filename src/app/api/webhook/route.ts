import crypto from "node:crypto";
import { db } from "@/server/db";
import { requestTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-request-network-signature");

    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("WEBHOOK_SECRET is not set");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { paymentReference, event, originalRequestPaymentReference } = body;

    switch (event) {
      case "payment.confirmed":
        await db.transaction(async (tx) => {
          const result = await tx
            .update(requestTable)
            .set({
              status: "paid",
            })
            .where(eq(requestTable.paymentReference, paymentReference))
            .returning({ id: requestTable.id });

          if (!result.length) {
            throw new Error(
              `No request found with payment reference: ${paymentReference}`,
            );
          }
        });
        break;
      case "request.recurring":
        await db.transaction(async (tx) => {
          const originalRequests = await tx
            .select()
            .from(requestTable)
            .where(
              eq(
                requestTable.paymentReference,
                originalRequestPaymentReference,
              ),
            );

          if (!originalRequests.length) {
            throw new Error(
              `No original request found with payment reference: ${originalRequestPaymentReference}`,
            );
          }

          const originalRequest = originalRequests[0];
          const { id, issuedDate, dueDate, ...requestWithoutId } =
            originalRequest;
          // Calculate the new due date by adding the interval to the issued date
          const now = new Date();
          const interval =
            new Date(dueDate).getTime() - new Date(issuedDate).getTime();
          const newDueDate = new Date(now.getTime() + interval);

          await tx.insert(requestTable).values({
            id: ulid(),
            issuedDate: now.toISOString(),
            ...requestWithoutId,
            dueDate: newDueDate.toISOString(),
            paymentReference: paymentReference,
            originalRequestPaymentReference: originalRequestPaymentReference,
          });
        });
        break;
      default:
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
