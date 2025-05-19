import crypto from "node:crypto";
import { ResourceNotFoundError } from "@/lib/errors";
import { getInvoiceCount } from "@/lib/invoice";
import { generateInvoiceNumber } from "@/lib/invoice/client";
import { db } from "@/server/db";
import {
  paymentDetailsPayersTable,
  type requestStatusEnum,
  requestTable,
  userTable,
} from "@/server/db/schema";
import { and, eq, not } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

/**
 * Updates the request status in the database
 */
async function updateRequestStatus(
  requestId: string,
  status: (typeof requestStatusEnum.enumValues)[number],
) {
  await db.transaction(async (tx) => {
    const result = await tx
      .update(requestTable)
      .set({ status })
      .where(eq(requestTable.requestId, requestId))
      .returning({ id: requestTable.id });

    if (!result.length) {
      throw new ResourceNotFoundError(
        `No request found with request ID: ${requestId}`,
      );
    }
  });
}

export async function POST(req: Request) {
  let webhookData: Record<string, unknown> = {};

  try {
    const body = await req.json();
    webhookData = body;
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

    const {
      requestId,
      event,
      originalRequestId,
      isCryptoToFiat,
      paymentReference,
    } = body;

    switch (event) {
      case "payment.confirmed":
        await updateRequestStatus(
          requestId,
          isCryptoToFiat ? "crypto_paid" : "paid",
        );
        break;
      case "settlement.initiated":
        await updateRequestStatus(requestId, "offramp_initiated");
        break;
      case "settlement.failed":
      case "settlement.bounced":
        await updateRequestStatus(requestId, "offramp_failed");
        break;
      case "settlement.pending_internal_assessment":
      case "settlement.ongoing_checks":
      case "settlement.sending_fiat":
        await updateRequestStatus(requestId, "offramp_pending");
        break;
      case "settlement.fiat_sent":
        await updateRequestStatus(requestId, "paid");
        break;
      case "request.recurring":
        await db.transaction(async (tx) => {
          const originalRequests = await tx
            .select()
            .from(requestTable)
            .where(eq(requestTable.requestId, originalRequestId));

          if (!originalRequests.length) {
            throw new ResourceNotFoundError(
              `No original request found with request ID: ${originalRequestId}`,
            );
          }

          const originalRequest = originalRequests[0];
          const { id, issuedDate, dueDate, ...requestWithoutId } =
            originalRequest;

          // Set the new issued date to today at midnight UTC
          const now = new Date();
          now.setUTCHours(0, 0, 0, 0);

          // Calculate the difference in days between original issue and due dates
          const originalIssuedDate = new Date(issuedDate);
          originalIssuedDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC due to rounding

          const originalDueDate = new Date(dueDate);
          originalDueDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC due to rounding

          // Calculate days difference using UTC dates to avoid timezone issues
          const daysDifference = Math.max(
            0,
            Math.floor(
              (originalDueDate.getTime() - originalIssuedDate.getTime()) /
                (24 * 60 * 60 * 1000),
            ),
          );

          // Calculate new due date by adding the same number of days to the new issue date
          const newDueDate = new Date(now);
          newDueDate.setDate(now.getDate() + daysDifference);

          const invoiceCount = await getInvoiceCount(originalRequest.userId);

          const invoiceNumber = generateInvoiceNumber(invoiceCount);

          await tx.insert(requestTable).values({
            id: ulid(),
            ...requestWithoutId,
            invoiceNumber,
            issuedDate: now.toISOString(),
            dueDate: newDueDate.toISOString(),
            requestId: requestId,
            originalRequestId: originalRequestId,
            paymentReference: paymentReference,
            status: "pending",
          });
        });
        break;
      case "compliance.updated": {
        const complianceUpdateResult = await db
          .update(userTable)
          .set({
            isCompliant: body.isCompliant,
            kycStatus: body.kycStatus,
            agreementStatus: body.agreementStatus,
          })
          .where(eq(userTable.email, body.clientUserId))
          .returning({ id: userTable.id });

        if (!complianceUpdateResult.length) {
          console.warn(
            `No user found with email ID: ${body.clientUserId} for compliance update`,
          );
        }
        break;
      }
      case "payment_detail.updated": {
        const paymentDetailUpdateResult = await db
          .update(paymentDetailsPayersTable)
          .set({
            status: body.status,
          })
          .where(
            and(
              eq(
                paymentDetailsPayersTable.externalPaymentDetailId,
                body.paymentDetailsId,
              ),
              not(eq(paymentDetailsPayersTable.status, "approved")),
            ),
          )
          .returning({ id: paymentDetailsPayersTable.id });

        if (!paymentDetailUpdateResult.length) {
          console.warn(
            `No payment detail found with payment details ID: ${body.paymentDetailsId} for status update`,
          );
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Payment webhook error:", {
      error,
      requestId: webhookData?.requestId,
      event: webhookData?.event,
    });

    if (error instanceof ResourceNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
