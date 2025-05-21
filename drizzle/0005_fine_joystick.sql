CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings');--> statement-breakpoint
CREATE TYPE "public"."agreement_status" AS ENUM('not_started', 'pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."beneficiary_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('not_started', 'initiated', 'pending', 'approved');--> statement-breakpoint
CREATE TYPE "public"."payment_details_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."rails_type" AS ENUM('local', 'swift', 'wire');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'paid', 'crypto_paid', 'offramp_initiated', 'offramp_failed', 'offramp_pending', 'processing', 'overdue');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "easyinvoice_payment_details_payers" (
	"id" text PRIMARY KEY NOT NULL,
	"paymentDetailsId" text NOT NULL,
	"payerId" text NOT NULL,
	"payment_details_status" "payment_details_status" DEFAULT 'pending',
	"externalPaymentDetailId" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "easyinvoice_payment_details" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bankName" text NOT NULL,
	"accountName" text NOT NULL,
	"accountNumber" text,
	"routingNumber" text,
	"account_type" "account_type" DEFAULT 'checking',
	"sortCode" text,
	"iban" text,
	"swiftBic" text,
	"documentNumber" text,
	"documentType" text,
	"ribNumber" text,
	"bsbNumber" text,
	"ncc" text,
	"branchCode" text,
	"bankCode" text,
	"ifsc" text,
	"beneficiary_type" "beneficiary_type" NOT NULL,
	"dateOfBirth" text,
	"addressLine1" text NOT NULL,
	"addressLine2" text,
	"city" text NOT NULL,
	"state" text,
	"postalCode" text NOT NULL,
	"country" text NOT NULL,
	"rails_type" "rails_type" DEFAULT 'local',
	"currency" text NOT NULL,
	"phone" text,
	"businessActivity" text,
	"nationality" text,
	"gender" "gender",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "easyinvoice_request" RENAME COLUMN "status" TO "request_status";--> statement-breakpoint
ALTER TABLE "easyinvoice_request" ADD COLUMN "originalRequestId" text;--> statement-breakpoint
ALTER TABLE "easyinvoice_request" ADD COLUMN "isCryptoToFiatAvailable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "easyinvoice_request" ADD COLUMN "paymentDetailsId" text;--> statement-breakpoint
ALTER TABLE "easyinvoice_user" ADD COLUMN "agreement_status" "agreement_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "easyinvoice_user" ADD COLUMN "kyc_status" "kyc_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "easyinvoice_user" ADD COLUMN "isCompliant" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_payment_details_payers" ADD CONSTRAINT "easyinvoice_payment_details_payers_paymentDetailsId_easyinvoice_payment_details_id_fk" FOREIGN KEY ("paymentDetailsId") REFERENCES "public"."easyinvoice_payment_details"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_payment_details_payers" ADD CONSTRAINT "easyinvoice_payment_details_payers_payerId_easyinvoice_user_id_fk" FOREIGN KEY ("payerId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_payment_details" ADD CONSTRAINT "easyinvoice_payment_details_userId_easyinvoice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."easyinvoice_user"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "easyinvoice_request" ADD CONSTRAINT "easyinvoice_request_paymentDetailsId_easyinvoice_payment_details_id_fk" FOREIGN KEY ("paymentDetailsId") REFERENCES "public"."easyinvoice_payment_details"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
