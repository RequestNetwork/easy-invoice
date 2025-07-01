// @/src/server/context.ts
import type * as trpc from "@trpc/server";
import type * as trpcNext from "@trpc/server/adapters/next";

import { getCurrentSession } from "./auth";
import { db } from "./db";

export async function createContext(ctx: trpcNext.CreateNextContextOptions) {
  const { req, res } = ctx;
  const { session, user } = await getCurrentSession();

  const ip = "";

  return {
    req,
    res,
    session,
    user,
    db,
    ip,
  };
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
