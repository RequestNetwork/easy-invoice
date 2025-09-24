import { z } from "zod";
import { shouldSkipValidation } from "./helpers.js";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_REOWN_PROJECT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_REOWN_PROJECT_ID is required"),
  NEXT_PUBLIC_GTM_ID: z.string().min(1, "NEXT_PUBLIC_GTM_ID is required"),
  NEXT_PUBLIC_DEMO_MEETING: z.string().url().optional(),
  NEXT_PUBLIC_API_TERMS_CONDITIONS: z.string().url().optional(),
  NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS: z.string().optional(),
});

export function validateClientEnv() {
  if (shouldSkipValidation()) {
    console.warn("⚠️ Skipping client environment variable validation.");
    return;
  }

  const env = {
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_DEMO_MEETING: process.env.NEXT_PUBLIC_DEMO_MEETING,
    NEXT_PUBLIC_API_TERMS_CONDITIONS:
      process.env.NEXT_PUBLIC_API_TERMS_CONDITIONS,
    NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS:
      process.env.NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS,
  };

  const result = clientEnvSchema.safeParse(env);

  if (!result.success) {
    console.error(
      "❌ Invalid client environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error("Invalid client environment variables");
  }
}
