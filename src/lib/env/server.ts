import { z } from "zod";
import { isBuildTime } from "./helpers";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  REQUEST_API_URL: z.string().url("REQUEST_API_URL must be a valid URL"),
  REQUEST_API_KEY: z.string().min(1, "REQUEST_API_KEY is required"),
  WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET is required"),
  GOOGLE_REDIRECT_URI: z
    .string()
    .url("GOOGLE_REDIRECT_URI must be a valid URL"),
  ENCRYPTION_KEY: z.string().optional(),
  CURRENT_ENCRYPTION_VERSION: z.string().optional(),
  FEE_PERCENTAGE_FOR_PAYMENT: z.string().optional(),
  FEE_ADDRESS_FOR_PAYMENT: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  INVOICE_PROCESSING_TTL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function createDummyServerEnv(): ServerEnv {
  return {
    DATABASE_URL: "postgresql://build:build@localhost:5432/build",
    GOOGLE_CLIENT_ID: "build-google-client-id",
    GOOGLE_CLIENT_SECRET: "build-google-client-secret",
    REQUEST_API_URL: "https://build.api.request.network",
    REQUEST_API_KEY: "build-request-api-key",
    WEBHOOK_SECRET: "build-webhook-secret",
    GOOGLE_REDIRECT_URI: "https://build.example.com/callback",
    ENCRYPTION_KEY: "build-encryption-key",
    CURRENT_ENCRYPTION_VERSION: "1",
    FEE_PERCENTAGE_FOR_PAYMENT: "0",
    FEE_ADDRESS_FOR_PAYMENT: "0x0000000000000000000000000000000000000000",
    REDIS_URL: "redis://build:6379",
    INVOICE_PROCESSING_TTL: "3600",
    VERCEL_URL: "build.vercel.app",
  };
}

export function validateServerEnv(): ServerEnv {
  if (isBuildTime()) {
    console.warn(
      "⚠️ Skipping server environment variable validation at build time.",
    );
    return createDummyServerEnv();
  }

  const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REQUEST_API_URL: process.env.REQUEST_API_URL,
    REQUEST_API_KEY: process.env.REQUEST_API_KEY,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    CURRENT_ENCRYPTION_VERSION: process.env.CURRENT_ENCRYPTION_VERSION,
    FEE_PERCENTAGE_FOR_PAYMENT: process.env.FEE_PERCENTAGE_FOR_PAYMENT,
    FEE_ADDRESS_FOR_PAYMENT: process.env.FEE_ADDRESS_FOR_PAYMENT,
    REDIS_URL: process.env.REDIS_URL,
    INVOICE_PROCESSING_TTL: process.env.INVOICE_PROCESSING_TTL,
  };

  const result = serverEnvSchema.safeParse(env);

  if (!result.success) {
    console.error(
      "❌ Invalid server environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error("Invalid server environment variables");
  }

  return result.data;
}

export const serverEnv = validateServerEnv();
