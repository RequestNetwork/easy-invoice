CREATE TABLE IF NOT EXISTS "easyinvoice_request" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"dueDate" text NOT NULL,
	"issuedDate" text NOT NULL,
	"clientName" text NOT NULL,
	"clientEmail" text NOT NULL,
	"invoiceNumber" text NOT NULL,
	"items" json NOT NULL,
	"notes" text,
	"amount" text NOT NULL,
	"invoiceCurrency" text NOT NULL,
	"paymentCurrency" text NOT NULL,
	"status" text NOT NULL,
	"payee" text NOT NULL,
	"requestId" text NOT NULL,
	"paymentReference" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "easyinvoice_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "easyinvoice_user" (
	"id" text PRIMARY KEY NOT NULL,
	"googleId" text,
	"name" text,
	CONSTRAINT "easyinvoice_user_googleId_unique" UNIQUE("googleId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_request" ADD CONSTRAINT "easyinvoice_request_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_session" ADD CONSTRAINT "easyinvoice_session_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
