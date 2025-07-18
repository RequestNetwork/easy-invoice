import { deleteSessionTokenCookie, invalidateSession } from "@/server/auth";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const authRouter = router({
  getSessionInfo: publicProcedure.query(async ({ ctx }) => {
    return {
      session: ctx.session,
      user: ctx.user,
    };
  }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { session } = ctx;

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    await invalidateSession(session.id);
    await deleteSessionTokenCookie();

    return { success: true };
  }),
});
