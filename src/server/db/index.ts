import { serverEnv, validateServerEnv } from "@/lib/env/server";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// We validate the server environment variables here to ensure they are checked
// as early as possible during the application startup.
validateServerEnv();

const pool = new Pool({
  connectionString: serverEnv.DATABASE_URL as string,
});

export const db = drizzlePg(pool, {
  schema: schema,
});

export type DB = NodePgDatabase<typeof schema>;
