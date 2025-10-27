import crypto from "node:crypto";
import { ResourceNotFoundError } from "@/lib/errors";
import { generateInvoiceNumber } from "@/lib/helpers/client";
import { getInvoiceCount } from "@/lib/helpers/invoice";
import type { ConversionInfo } from "@/lib/types";
import { db } from "@/server/db";
import {
  type ClientPayment,
  type RecurringPaymentInstallment,
  type Request as RequestModel,
  clientPaymentTable,
  ecommerceClientTable,
  paymentDetailsPayersTable,
  recurringPaymentTable,
  requestTable,
  userTable,
} from "@/server/db/schema";
import { and, eq, not } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

type ClientPaymentBody = Omit<
  ClientPayment,
  "id" | "userId" | "ecommerceClientId" | "createdAt"
>;

function getClientPaymentBody(
  webhookBody: any,
  conversionInfo: ConversionInfo | null,
): ClientPaymentBody {
  const requiredFields = [
    "requestId",
    "currency",
    "paymentCurrency",
    "txHash",
    "network",
    "amount",
  ];

  const missingFields = requiredFields.filter((field) => !webhookBody[field]);
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required webhook fields: ${missingFields.join(", ")}`,
    );
  }
  const clientPaymentBody: ClientPaymentBody = {
    requestId: webhookBody.requestId,
    invoiceCurrency: webhookBody.currency,
    paymentCurrency: webhookBody.paymentCurrency,
    txHash: webhookBody.txHash,
    network: webhookBody.network,
    amount: webhookBody.amount,
    customerInfo: webhookBody.customerInfo || null,
    reference: webhookBody.reference || null,
    origin: webhookBody.origin,
    conversionInfo,
  };

  return clientPaymentBody;
}

async function addClientPayment(
  clientPaymentBody: ClientPaymentBody,
  clientId: string,
) {
  await db.transaction(async (tx) => {
    const ecommerceClient = await tx
      .select()
      .from(ecommerceClientTable)
      .where(eq(ecommerceClientTable.rnClientId, clientId))
      .limit(1);

    if (!ecommerceClient.length) {
      throw new ResourceNotFoundError(
        `No ecommerce client found with client ID: ${clientId}`,
      );
    }

    const client = ecommerceClient[0];

    const inserted = await tx
      .insert(clientPaymentTable)
      .values({
        id: ulid(),
        userId: client.userId,
        ecommerceClientId: client.id,
        ...clientPaymentBody,
      })
      .onConflictDoNothing({
        target: [clientPaymentTable.requestId, clientPaymentTable.txHash],
      })
      .returning({ id: clientPaymentTable.id });

    if (!inserted.length) {
      console.warn(
        `Duplicate client payment detected for requestId: ${clientPaymentBody.requestId} and txHash: ${clientPaymentBody.txHash}`,
      );
      return;
    }
  });
}

/**
 * Updates the request status in the database
 */
async function updateRequest(
  requestId: string,
  requestData: Partial<RequestModel>,
) {
  await db.transaction(async (tx) => {
    const result = await tx
      .update(requestTable)
      .set({ ...requestData })
      .where(eq(requestTable.requestId, requestId))
      .returning({ id: requestTable.id });

    if (!result.length) {
      throw new ResourceNotFoundError(
        `No request found with request ID: ${requestId}`,
      );
    }
  });
}

/**
 * Adds a payment to the recurring payment's payments array
 */
async function addPaymentToRecurringPayment(
  externalPaymentId: string,
  payment: RecurringPaymentInstallment,
) {
  await db.transaction(async (tx) => {
    const recurringPayments = await tx
      .select()
      .from(recurringPaymentTable)
      .where(eq(recurringPaymentTable.externalPaymentId, externalPaymentId));

    if (!recurringPayments.length) {
      throw new ResourceNotFoundError(
        `No recurring payment found with external payment ID: ${externalPaymentId}`,
      );
    }

    const recurringPayment = recurringPayments[0];
    const currentPayments = recurringPayment.payments || [];
    const updatedPayments = [...currentPayments, payment];

    const isDuplicate = currentPayments.some(
      (p) => p.txHash === payment.txHash,
    );
    if (isDuplicate) {
      console.warn(`Duplicate payment detected for txHash: ${payment.txHash}`);
      return;
    }

    await tx
      .update(recurringPaymentTable)
      .set({
        status: "active",
        payments: updatedPayments,
        currentNumberOfPayments: updatedPayments.length,
      })
      .where(eq(recurringPaymentTable.externalPaymentId, externalPaymentId));
  });
}

function getConversionInfo(webhookBody: any): ConversionInfo | null {
  if (
    !webhookBody.conversionRate ||
    !webhookBody.convertedAmountSource ||
    !webhookBody.convertedAmountDestination ||
    !webhookBody.conversionRateSource ||
    !webhookBody.conversionRateDestination ||
    !webhookBody.rateProvider
  ) {
    return null;
  }

  return {
    conversionRate: webhookBody.conversionRate,
    convertedAmountSource: webhookBody.convertedAmountSource,
    convertedAmountDestination: webhookBody.convertedAmountDestination,
    conversionRateSource: webhookBody.conversionRateSource,
    conversionRateDestination: webhookBody.conversionRateDestination,
    rateProvider: webhookBody.rateProvider,
  };
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
      subStatus,
    } = body;

    const conversionInfo = getConversionInfo(body);

    switch (event) {
      case "payment.confirmed":
        // if this is defined, it's a payment that's part of a recurring payment
        if (body.recurringPayment?.id) {
          if (!body.txHash) {
            console.error(
              `Missing txHash for recurring payment ${body.recurringPayment.id}`,
            );
            return NextResponse.json(
              { error: "Missing transaction hash" },
              { status: 400 },
            );
          }
          await addPaymentToRecurringPayment(body.recurringPayment.id, {
            date: body.timestamp,
            txHash: body.txHash,
            requestScanUrl: body.explorer,
            conversionInfo,
          });
        } else if (body.clientId) {
          const clientPaymentBody = getClientPaymentBody(body, conversionInfo);
          await addClientPayment(clientPaymentBody, body.clientId);
        } else {
          await updateRequest(requestId, {
            status: isCryptoToFiat ? "crypto_paid" : "paid",
          });
        }
        break;
      case "payment.processing":
        switch (subStatus) {
          case "initiated":
            await updateRequest(requestId, { status: "offramp_initiated" });
            break;
          case "failed":
          case "bounced":
            await updateRequest(requestId, { status: "offramp_failed" });
            break;
          case "pending_internal_assessment":
          case "ongoing_checks":
          case "sending_fiat":
            await updateRequest(requestId, { status: "offramp_pending" });
            break;
          case "fiat_sent":
            await updateRequest(requestId, { status: "paid" });
            break;
          default: {
            console.error(
              `Unhandled payment.processing subStatus "${subStatus}" for request ${requestId}`,
            );
            return NextResponse.json(
              { error: `Unknown subStatus "${subStatus}"` },
              { status: 422 },
            );
          }
        }
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
