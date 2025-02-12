import crypto from "node:crypto";
import { db } from "@/server/db";
import { requestTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    const { paymentReference } = body;

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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
