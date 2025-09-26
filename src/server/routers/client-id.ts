import { apiClient } from "@/lib/axios";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import { toTRPCError } from "@/lib/errors";
import { clientIdApiSchema } from "@/lib/schemas/client-id";
import { and, eq, not } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { clientIdTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const clientIdRouter = router({
  create: protectedProcedure
    .input(clientIdApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      try {
        const existingClientId = await db.query.clientIdTable.findMany({
          where: and(
            eq(clientIdTable.userId, user.id),
            eq(clientIdTable.domain, input.domain),
          ),
        });

        if (existingClientId.length > 0) {
          throw new Error("Client ID for this domain already exists.");
        }

        const response = await apiClient.post("v2/client-ids", {
          label: input.label,
          allowedDomains: [input.domain],
          feeAddress: input.feeAddress,
          feePercentage: input.feePercentage,
        });

        if (!response.data.clientId) {
          throw new Error("Failed to create client ID via external API.");
        }

        await db.insert(clientIdTable).values({
          id: ulid(),
          userId: user.id,
          domain: input.domain,
          clientId: response.data.clientId,
          label: input.label,
          feeAddress: input.feeAddress,
          feePercentage: input.feePercentage?.toString() ?? undefined,
        });
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    try {
      const clientIds = await db.query.clientIdTable.findMany({
        where: eq(clientIdTable.userId, user.id),
      });
      return clientIds;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      try {
        const existingClientId = await db.query.clientIdTable.findFirst({
          where: and(
            not(eq(clientIdTable.domain, DEFAULT_CLIENT_ID_DOMAIN)), // they can't delete the default one
            eq(clientIdTable.userId, user.id),
            eq(clientIdTable.id, input),
          ),
        });
        if (!existingClientId) {
          throw new Error("Client ID not found.");
        }

        await db
          .delete(clientIdTable)
          .where(eq(clientIdTable.id, existingClientId.id));
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
