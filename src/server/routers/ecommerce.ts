import { apiClient } from "@/lib/axios";
import { DEFAULT_CLIENT_ID_DOMAIN } from "@/lib/constants/ecommerce";
import { toTRPCError } from "@/lib/errors";
import {
  ecommerceClientApiSchema,
  editecommerceClientApiSchema,
} from "@/lib/schemas/ecommerce";
import { and, eq, not, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { clientPaymentTable, ecommerceClientTable } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const ecommerceRouter = router({
  create: protectedProcedure
    .input(ecommerceClientApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      try {
        const existingEcommerceClient =
          await db.query.ecommerceClientTable.findFirst({
            where: and(
              eq(ecommerceClientTable.userId, user.id),
              eq(ecommerceClientTable.domain, input.domain),
            ),
          });

        if (existingEcommerceClient) {
          throw new Error("Ecommerce client for this domain already exists.");
        }

        const response = await apiClient.post("v2/client-ids", {
          label: input.label,
          allowedDomains: [input.domain],
          feePercentage: input.feePercentage ?? undefined,
          feeAddress: input.feeAddress ?? undefined,
        });

        if (!response.data.clientId) {
          throw new Error("Failed to create client on external API.");
        }

        await db.insert(ecommerceClientTable).values({
          id: ulid(),
          userId: user.id,
          domain: input.domain,
          externalId: response.data.id,
          rnClientId: response.data.clientId,
          label: input.label,
          feeAddress: input.feeAddress ?? null,
          feePercentage: input.feePercentage ?? null,
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
          throw new Error("Client not found or doesn't belong to this user.");
        }

        if (input.domain !== existingEcommerceClient.domain) {
          const conflictingClient =
            await db.query.ecommerceClientTable.findFirst({
              where: and(
                eq(ecommerceClientTable.userId, user.id),
                eq(ecommerceClientTable.domain, input.domain),
                not(eq(ecommerceClientTable.id, input.id)),
              ),
            });

          if (conflictingClient) {
            throw new Error("Another client already exists for this domain.");
          }
        }

        await apiClient.put(
          `v2/client-ids/${existingEcommerceClient.externalId}`,
          {
            label: input.label,
            allowedDomains: [input.domain],
            feePercentage: input.feePercentage ?? null,
            feeAddress: input.feeAddress ?? null,
          },
        );

        await db
          .update(ecommerceClientTable)
          .set({
            label: input.label,
            domain: input.domain,
            feeAddress: input.feeAddress ?? null,
            feePercentage: input.feePercentage ?? null,
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

        await db
          .delete(ecommerceClientTable)
          .where(eq(ecommerceClientTable.id, existingEcommerceClient.id));

        await apiClient.delete(
          `v2/client-ids/${existingEcommerceClient.externalId}`,
        );
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
  getAllClientPayments: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    try {
      const clientPayments = await db.query.clientPaymentTable.findMany({
        where: eq(clientPaymentTable.userId, user.id),
        with: {
          ecommerceClient: true,
        },
      });

      return clientPayments;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  getAllUserReceipts: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    try {
      const receipts = await db.query.clientPaymentTable.findMany({
        where: sql`${clientPaymentTable.customerInfo}->>'email' = ${user.email}`,
        with: {
          ecommerceClient: true,
        },
      });

      return receipts;
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
