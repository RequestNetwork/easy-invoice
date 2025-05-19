import { type EncryptionVersion, getEncryptionKey } from "@/lib/encryption";
import CryptoJS from "crypto-js";
import { type InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  customType,
  json,
  pgEnum,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `easyinvoice_${name}`);

const encryptionKey = process.env.ENCRYPTION_KEY as string;

// Define enum types for status fields
export const agreementStatusEnum = pgEnum("agreement_status", [
  "not_started",
  "pending",
  "completed",
]);
export const kycStatusEnum = pgEnum("kyc_status", [
  "not_started",
  "initiated",
  "pending",
  "approved",
]);
export const beneficiaryTypeEnum = pgEnum("beneficiary_type", [
  "individual",
  "business",
]);
export const accountTypeEnum = pgEnum("account_type", ["checking", "savings"]);
export const railsTypeEnum = pgEnum("rails_type", ["local", "swift", "wire"]);
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);
export const paymentDetailsStatusEnum = pgEnum("payment_details_status", [
  "pending",
  "approved",
  "rejected",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "paid",
  "crypto_paid",
  "offramp_initiated",
  "offramp_failed",
  "offramp_pending",
  "processing",
  "overdue",
]);

// biome-ignore lint/correctness/noUnusedVariables: This is a type definition that will be used in future database migrations
const encryptedText = customType<{ data: string }>({
  dataType() {
    return "text";
  },
  fromDriver(value: unknown) {
    const stringValue = String(value);
    if (!stringValue.includes(":")) {
      return CryptoJS.AES.decrypt(stringValue, encryptionKey).toString(
        CryptoJS.enc.Utf8,
      );
    }
    const [version, encryptedData] = stringValue.split(":");
    const key = getEncryptionKey(version as EncryptionVersion);
    return CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
  },
  toDriver(value: string) {
    const currentVersion = process.env
      .CURRENT_ENCRYPTION_VERSION as EncryptionVersion;
    const encrypted = CryptoJS.AES.encrypt(value, encryptionKey).toString();
    return `${currentVersion}:${encrypted}`;
  },
});

export const userTable = createTable("user", {
  id: text().primaryKey().notNull(),
  googleId: text().unique(),
  name: text(),
  email: text().unique(),
  agreementStatus: agreementStatusEnum("agreement_status").default("pending"),
  kycStatus: kycStatusEnum("kyc_status").default("pending"),
  isCompliant: boolean().default(false),
});

export const paymentDetailsTable = createTable("payment_details", {
  id: text().primaryKey().notNull(),
  userId: text()
    .notNull()
    .references(() => userTable.id, {
      onDelete: "restrict",
    }),
  bankName: text().notNull(),
  accountName: text().notNull(),
  accountNumber: text(), // Format varies by country
  routingNumber: text(), // Format varies by country
  accountType: accountTypeEnum("account_type").default("checking"),
  sortCode: text(), // UK: 6 digits format
  iban: text(), // International Bank Account Number - country-specific format
  swiftBic: text(), // 8 or 11 characters
  documentNumber: text(),
  documentType: text(),
  ribNumber: text(), // France: Relevé d'Identité Bancaire
  bsbNumber: text(), // Australia: 6 digits
  ncc: text(),
  branchCode: text(),
  bankCode: text(),
  ifsc: text(), // India: 11 character code
  beneficiaryType: beneficiaryTypeEnum("beneficiary_type").notNull(),
  dateOfBirth: text(), // Format: YYYY-MM-DD
  addressLine1: text().notNull(),
  addressLine2: text(),
  city: text().notNull(),
  state: text(),
  postalCode: text().notNull(),
  country: text().notNull(), // ISO 3166-1 alpha-2 (2 characters)
  rails: railsTypeEnum("rails_type").default("local"),
  currency: text().notNull(), // ISO 4217 (3 characters)
  phone: text(), // E.164 format recommended
  businessActivity: text(),
  nationality: text(), // ISO 3166-1 alpha-2 (2 characters)
  gender: genderEnum("gender"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New junction table to link payment details with multiple payers
export const paymentDetailsPayersTable = createTable("payment_details_payers", {
  id: text().primaryKey().notNull(),
  paymentDetailsId: text()
    .notNull()
    .references(() => paymentDetailsTable.id, {
      onDelete: "cascade",
    }),
  payerId: text()
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),
  status: paymentDetailsStatusEnum("payment_details_status").default("pending"),
  externalPaymentDetailId: text().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const requestTable = createTable("request", {
  id: text().primaryKey().notNull(),
  type: text().notNull(),
  dueDate: text().notNull(),
  issuedDate: text().notNull(),
  clientName: text().notNull(),
  clientEmail: text().notNull(),
  creatorName: text().notNull(),
  creatorEmail: text().notNull(),
  invoiceNumber: text().notNull(),
  items: json().notNull(),
  notes: text(),
  amount: text().notNull(),
  invoiceCurrency: text().notNull(),
  paymentCurrency: text().notNull(),
  status: requestStatusEnum("request_status").notNull(),
  payee: text().notNull(),
  requestId: text().notNull(),
  paymentReference: text().notNull(),
  originalRequestPaymentReference: text(),
  originalRequestId: text(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: text()
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),
  invoicedTo: text(),
  recurrence: json().$type<{
    startDate: string;
    frequency: string;
  }>(),
  isRecurrenceStopped: boolean().default(false),
  isCryptoToFiatAvailable: boolean().default(false),
  paymentDetailsId: text().references(() => paymentDetailsTable.id, {
    onDelete: "set null",
  }),
});

export const sessionTable = createTable("session", {
  id: text().primaryKey().notNull(),
  userId: text()
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const invoiceMeTable = createTable("invoice_me", {
  id: text().primaryKey().notNull(),
  label: text().notNull(),
  userId: text()
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relationships

export const userRelations = relations(userTable, ({ many }) => ({
  requests: many(requestTable),
  session: many(sessionTable),
  invoiceMe: many(invoiceMeTable),
  paymentDetailsPayers: many(paymentDetailsPayersTable),
}));

export const requestRelations = relations(requestTable, ({ one }) => ({
  user: one(userTable, {
    fields: [requestTable.userId],
    references: [userTable.id],
  }),
  paymentDetails: one(paymentDetailsTable, {
    fields: [requestTable.paymentDetailsId],
    references: [paymentDetailsTable.id],
  }),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const invoiceMeRelations = relations(invoiceMeTable, ({ one }) => ({
  user: one(userTable, {
    fields: [invoiceMeTable.userId],
    references: [userTable.id],
  }),
}));

export const paymentDetailsRelations = relations(
  paymentDetailsTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [paymentDetailsTable.userId],
      references: [userTable.id],
    }),
    payers: many(paymentDetailsPayersTable),
  }),
);

export const paymentDetailsPayersRelations = relations(
  paymentDetailsPayersTable,
  ({ one }) => ({
    paymentDetails: one(paymentDetailsTable, {
      fields: [paymentDetailsPayersTable.paymentDetailsId],
      references: [paymentDetailsTable.id],
    }),
    payer: one(userTable, {
      fields: [paymentDetailsPayersTable.payerId],
      references: [userTable.id],
    }),
  }),
);

export type Request = InferSelectModel<typeof requestTable>;
export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
export type InvoiceMe = InferSelectModel<typeof invoiceMeTable>;
export type PaymentDetails = InferSelectModel<typeof paymentDetailsTable>;
export type PaymentDetailsPayers = InferSelectModel<
  typeof paymentDetailsPayersTable
>;
