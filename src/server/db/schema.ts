import { type EncryptionVersion, getEncryptionKey } from "@/lib/encryption";
import CryptoJS from "crypto-js";
import { InferSelectModel } from "drizzle-orm";
import {
  customType,
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
});

export const requestTable = createTable("request", {
  id: text().primaryKey().notNull(),
  type: text().notNull(),
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

export type Request = InferSelectModel<typeof requestTable>;
export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
