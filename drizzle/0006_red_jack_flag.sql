CREATE TYPE "public"."frequency_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "easyinvoice_recurringPayment" (
	"id" text PRIMARY KEY NOT NULL,
	"totalAmountPerMonth" text NOT NULL,
	"paymentCurrency" text NOT NULL,
	"chain" text NOT NULL,
	"totalNumberOfPayments" integer,
	"currentNumberOfPayments" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"userId" text NOT NULL,
	"recurrence" json,
	"recipient" json,
	"payments" json,
	"isRecurrenceStopped" boolean DEFAULT false
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_recurringPayment" ADD CONSTRAINT "easyinvoice_recurringPayment_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
