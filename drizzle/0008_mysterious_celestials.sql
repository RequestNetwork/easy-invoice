ALTER TABLE "easyinvoice_recurring_payment" ADD COLUMN "payer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "easyinvoice_subscription_plans" ADD COLUMN "active" boolean DEFAULT true NOT NULL;