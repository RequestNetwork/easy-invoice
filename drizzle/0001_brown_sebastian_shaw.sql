CREATE TABLE IF NOT EXISTS "easyinvoice_invoice_me" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"userId" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "easyinvoice_request" ADD COLUMN "creatorName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "easyinvoice_request" ADD COLUMN "creatorEmail" text NOT NULL;--> statement-breakpoint
ALTER TABLE "easyinvoice_request" ADD COLUMN "invoicedTo" text;--> statement-breakpoint
ALTER TABLE "easyinvoice_user" ADD COLUMN "email" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_invoice_me" ADD CONSTRAINT "easyinvoice_invoice_me_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "easyinvoice_user" ADD CONSTRAINT "easyinvoice_user_email_unique" UNIQUE("email");