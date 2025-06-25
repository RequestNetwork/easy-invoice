CREATE TYPE "public"."frequency_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."recurring_payment_status" AS ENUM('pending', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "easyinvoice_recurring_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "recurring_payment_status" DEFAULT 'pending' NOT NULL,
	"totalAmountPerMonth" text NOT NULL,
	"paymentCurrency" text NOT NULL,
	"chain" text NOT NULL,
	"totalNumberOfPayments" integer,
	"currentNumberOfPayments" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"userId" text NOT NULL,
	"recurrence" json NOT NULL,
	"recipient" json NOT NULL,
	"payments" json
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_recurring_payment" ADD CONSTRAINT "easyinvoice_recurring_payment_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
