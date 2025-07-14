CREATE TABLE IF NOT EXISTS "easyinvoice_subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"userId" text NOT NULL,
	"paymentCurrency" text NOT NULL,
	"chain" text NOT NULL,
	"totalNumberOfPayments" integer NOT NULL,
	"frequency" "frequency_enum" NOT NULL,
	"amount" text NOT NULL,
	"recipient" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "easyinvoice_recurring_payment" RENAME COLUMN "totalAmountPerMonth" TO "totalAmount";--> statement-breakpoint
ALTER TABLE "easyinvoice_recurring_payment" ADD COLUMN "subscriptionId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_subscription_plans" ADD CONSTRAINT "easyinvoice_subscription_plans_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
