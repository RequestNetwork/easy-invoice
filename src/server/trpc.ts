import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { getCurrentSession } from "./auth";
import type { Context } from "./context";
import { db } from "./db";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { session, user } = await getCurrentSession();

  let ip = opts.headers.get("x-forwarded-for");

  if (ip === "::1" || ip === "127.0.0.1") {
    ip = "203.0.113.195";
  }

  return {
    ip,
    session,
    user,
    db,
    ...opts,
  };
};

export const protectedProcedure = t.procedure.use(enforceUserIsAuthenticated);
