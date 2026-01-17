import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
});

export const db = drizzlePg(pool, {
  schema: schema,
});

export type DB = NodePgDatabase<typeof schema>;
