import { validateClientEnv } from "./src/lib/env/client.js";
import { validateServerEnv } from "./src/lib/env/server.js";

if (process.env.SKIP_ENV_VALIDATION !== "true") {
  validateServerEnv();
  validateClientEnv();
}

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
