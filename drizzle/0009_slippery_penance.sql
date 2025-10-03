CREATE TABLE IF NOT EXISTS "easyinvoice_ecommerce_client" (
	"id" text PRIMARY KEY NOT NULL,
	"externalId" text NOT NULL,
	"rnClientId" text NOT NULL,
	"userId" text NOT NULL,
	"label" text NOT NULL,
	"domain" text NOT NULL,
	"feeAddress" text,
	"feePercentage" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_ecommerce_client" ADD CONSTRAINT "easyinvoice_ecommerce_client_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ecommerce_client_user_id_domain_unique" ON "easyinvoice_ecommerce_client" USING btree ("userId","domain");