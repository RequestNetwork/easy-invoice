import type * as trpcNext from "@trpc/server/adapters/next";
import { getCurrentSession } from "./auth";
import { db } from "./db";

export async function createContext() {
  const { session, user } = await getCurrentSession();
  const ip = "";

  return {
    session,
    user,
    db,
    ip,
  };
}

export type Context = {
  headers?: Headers;
  req?: trpcNext.CreateNextContextOptions["req"];
  res?: trpcNext.CreateNextContextOptions["res"];
  session: Awaited<ReturnType<typeof getCurrentSession>>["session"];
  user: Awaited<ReturnType<typeof getCurrentSession>>["user"];
  db: typeof db;
  ip: string | null;
};
