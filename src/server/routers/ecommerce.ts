import { apiClient } from "@/lib/axios";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import { toTRPCError } from "@/lib/errors";
import {
  ecommerceClientApiSchema,
  editecommerceClientApiSchema,
} from "@/lib/schemas/ecommerce";
import { and, eq, not } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { ecommerceClientTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const ecommerceRouter = router({
  create: protectedProcedure
    .input(ecommerceClientApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      try {
        const existingEcommerceClient =
          await db.query.ecommerceClientTable.findMany({
            where: and(
              eq(ecommerceClientTable.userId, user.id),
              eq(ecommerceClientTable.domain, input.domain),
            ),
          });

        if (existingEcommerceClient.length > 0) {
          throw new Error("Ecommerce client for this domain already exists.");
        }

        const response = await apiClient.post("v2/client-ids", {
          label: input.label,
          allowedDomains: [input.domain],
          ...(input.feeAddress && input.feePercentage
            ? {
                feeAddress: input.feeAddress,
                feePercentage: input.feePercentage,
              }
            : {}),
        });

        if (!response.data.ecommerceClient) {
          throw new Error("Failed to create client ID via external API.");
        }

        await db.insert(ecommerceClientTable).values({
          id: ulid(),
          userId: user.id,
          domain: input.domain,
          externalId: response.data.ecommerceClient.id,
          rnClientId: response.data.clientId,
          label: input.label,
          feeAddress: input.feeAddress,
          feePercentage: input.feePercentage?.toString() ?? undefined,
        });
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  edit: protectedProcedure
    .input(editecommerceClientApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      try {
        const existingEcommerceClient =
          await db.query.ecommerceClientTable.findFirst({
            where: and(
              eq(ecommerceClientTable.userId, user.id),
              eq(ecommerceClientTable.id, input.id),
            ),
          });

        if (!existingEcommerceClient) {
          throw new Error("Client ID for this user doesn't exist.");
        }

        await apiClient.put(
          `v2/client-ids/${existingEcommerceClient.externalId}`,
          {
            label: input.label,
            allowedDomains: [input.domain],
            ...(input.feeAddress && input.feePercentage
              ? {
                  feeAddress: input.feeAddress,
                  feePercentage: input.feePercentage,
                }
              : {}),
          },
        );

        await db
          .update(ecommerceClientTable)
          .set({
            label: input.label,
            domain: input.domain,
            feeAddress: input.feeAddress,
            feePercentage: input.feePercentage?.toString() ?? undefined,
          })
          .where(eq(ecommerceClientTable.id, input.id));
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    try {
      const ecommerceClients = await db.query.ecommerceClientTable.findMany({
        where: eq(ecommerceClientTable.userId, user.id),
      });
      return ecommerceClients;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  delete: protectedProcedure
    .input(z.string().min(1, "ID is required"))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      try {
        const existingEcommerceClient =
          await db.query.ecommerceClientTable.findFirst({
            where: and(
              not(eq(ecommerceClientTable.domain, DEFAULT_CLIENT_ID_DOMAIN)), // they can't delete the default one
              eq(ecommerceClientTable.userId, user.id),
              eq(ecommerceClientTable.id, input),
            ),
          });
        if (!existingEcommerceClient) {
          throw new Error("Client ID not found.");
        }

        await apiClient.delete(
          `v2/client-ids/${existingEcommerceClient.externalId}`,
        );

        await db
          .delete(ecommerceClientTable)
          .where(eq(ecommerceClientTable.id, existingEcommerceClient.id));
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
