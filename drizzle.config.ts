import type { Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      (() => {
        throw new Error("DATABASE_URL is not set");
      })(),
  },
  tablesFilter: ["easyinvoice_*"],
} satisfies Config;
