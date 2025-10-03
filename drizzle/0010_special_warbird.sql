CREATE TABLE IF NOT EXISTS "easyinvoice_client_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"requestId" text NOT NULL,
	"ecommerceClientId" text NOT NULL,
	"invoiceCurrency" text NOT NULL,
	"paymentCurrency" text NOT NULL,
	"txHash" text NOT NULL,
	"network" text NOT NULL,
	"amount" text NOT NULL,
	"customerInfo" json,
	"reference" text,
	"origin" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_client_payment" ADD CONSTRAINT "easyinvoice_client_payment_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_client_payment" ADD CONSTRAINT "easyinvoice_client_payment_ecommerceClientId_easyinvoice_ecommerce_client_id_fk" FOREIGN KEY ("ecommerceClientId") REFERENCES "public"."easyinvoice_ecommerce_client"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ecommerce_client_user_id_client_id_unique" ON "easyinvoice_ecommerce_client" USING btree ("rnClientId");