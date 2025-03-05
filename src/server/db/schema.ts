import { type EncryptionVersion, getEncryptionKey } from "@/lib/encryption";
import CryptoJS from "crypto-js";
import { type InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  customType,
  json,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `easyinvoice_${name}`);

const encryptionKey = process.env.ENCRYPTION_KEY as string;

// biome-ignore lint/correctness/noUnusedVariables: Will be used in the future
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
  status: text().notNull(),
  payee: text().notNull(),
  requestId: text().notNull(),
  paymentReference: text().notNull(),
  originalRequestPaymentReference: text(),
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
}));

export const requestRelations = relations(requestTable, ({ one }) => ({
  user: one(userTable, {
    fields: [requestTable.userId],
    references: [userTable.id],
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

export type Request = InferSelectModel<typeof requestTable>;
export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
export type InvoiceMe = InferSelectModel<typeof invoiceMeTable>;
