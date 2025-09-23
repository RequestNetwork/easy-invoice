import type { Config } from "drizzle-kit";
import { serverEnv } from "./src/lib/env/server";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      serverEnv.DATABASE_URL ??
      (() => {
        throw new Error("DATABASE_URL is not set");
      })(),
  },
  tablesFilter: ["easyinvoice_*"],
} satisfies Config;
