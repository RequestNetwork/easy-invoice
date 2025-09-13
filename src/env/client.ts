import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_REOWN_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_API_TERMS_CONDITIONS: z.string().url(),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
    NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    NEXT_PUBLIC_API_TERMS_CONDITIONS:
      process.env.NEXT_PUBLIC_API_TERMS_CONDITIONS,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS:
      process.env.NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS,
  },
});
