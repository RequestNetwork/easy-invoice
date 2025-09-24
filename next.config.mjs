import { validateClientEnv } from "./src/lib/env/client.js";
import { validateServerEnv } from "./src/lib/env/server.js";

validateServerEnv();
validateClientEnv();
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
