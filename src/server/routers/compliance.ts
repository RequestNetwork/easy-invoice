import { apiClient } from "@/lib/axios";
import { complianceFormSchema } from "@/lib/schemas/compliance";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const complianceRouter = router({
  submitComplianceInfo: publicProcedure
    .input(complianceFormSchema)
    .mutation(async ({ input }) => {
      try {
        const complianceEndpoint = "/v1/payer/compliance";

        const response = await apiClient.post(complianceEndpoint, input);

        return {
          success: true,
          data: response.data,
          message: "Compliance information submitted successfully",
        };
      } catch (error) {
        console.error("Compliance API error:", error);
        throw error;
      }
    }),

  updateAgreementStatus: protectedProcedure
    .input(
      z.object({
        clientUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Make the API call to Request Network using apiClient
        const response = await apiClient.patch(
          `/v1/payer/compliance/${input.clientUserId}`,
          { agreementCompleted: true },
        );

        if (response.status !== 200) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              response.data?.message || "Failed to update agreement status",
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating agreement status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update agreement status",
        });
      }
    }),

  getComplianceStatus: protectedProcedure
    .input(
      z.object({
        clientUserId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Get the compliance status from Request Network
        try {
          const response = await apiClient.get(
            `/v1/payer/compliance/${input.clientUserId}`,
          );

          return {
            success: true,
            data: response.data,
          };
        } catch (apiError: any) {
          // If the user doesn't exist yet in the compliance system, return default status
          if (apiError.response?.status === 404) {
            return {
              success: true,
              data: {
                kycStatus: "not_started",
                agreementStatus: "not_started",
                isCompliant: false,
              },
            };
          }

          // Re-throw for other API errors
          throw apiError;
        }
      } catch (error) {
        console.error("Error getting compliance status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get compliance status",
        });
      }
    }),
});
