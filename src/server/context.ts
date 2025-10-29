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
  session: Awaited<ReturnType<typeof getCurrentSession>>["session"];
  user: Awaited<ReturnType<typeof getCurrentSession>>["user"];
  db: typeof db;
  ip: string | null;
};
