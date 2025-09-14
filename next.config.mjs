import { fileURLToPath } from "node:url";
import createJiti from "jiti";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants.js";

/** @type {import('next').NextConfig | ((phase: string) => import('next').NextConfig)} */
export default function nextConfig(phase) {
  const jiti = createJiti(fileURLToPath(import.meta.url));

  const skipValidation = process.env.SKIP_ENV_VALIDATION === "1";

  if (!skipValidation) {
    if (
      phase === PHASE_DEVELOPMENT_SERVER ||
      phase === PHASE_PRODUCTION_BUILD
    ) {
      jiti("./src/env/server.ts");
      jiti("./src/env/client.ts");
    }
  }

  return {};
}
