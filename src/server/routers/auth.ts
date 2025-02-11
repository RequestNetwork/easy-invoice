import { TRPCError } from "@trpc/server";
import { deleteSessionTokenCookie, invalidateSession } from "../auth";
import { protectedProcedure, router } from "../trpc";

export const authRouter = router({
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
