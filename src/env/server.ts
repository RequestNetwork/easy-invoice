import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ENCRYPTION_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().min(1),
    CURRENT_ENCRYPTION_VERSION: z.string().min(1),
    REQUEST_API_URL: z.string().url(),
    REQUEST_API_KEY: z.string().min(1),
    WEBHOOK_SECRET: z.string().min(1),
    FEE_PERCENTAGE_FOR_PAYMENT: z.string().default(""),
    FEE_ADDRESS_FOR_PAYMENT: z.string().default(""),
    REDIS_URL: z.string().default(""),
    INVOICE_PROCESSING_TTL: z.string().default(""),
    NODE_ENV: z.enum(["development", "production", "test"]),
    VERCEL_URL: z.string().optional(),
    PORT: z.coerce.number().optional(),
  },
  experimental__runtimeEnv: process.env,
});
