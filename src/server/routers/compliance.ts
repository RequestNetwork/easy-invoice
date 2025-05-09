import { apiClient } from "@/lib/axios";
import { bankAccountSchema } from "@/lib/schemas/bank-account";
import { complianceFormSchema } from "@/lib/schemas/compliance";
import { TRPCError } from "@trpc/server";
import { AxiosError, type AxiosResponse } from "axios";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import {
  paymentDetailsPayersTable,
  paymentDetailsTable,
  userTable,
} from "../db/schema";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Define interfaces for consistent return types
interface ComplianceStatusResponse {
  success: boolean;
  data: {
    kycStatus: string;
    agreementStatus: string;
    isCompliant: boolean;
    [key: string]: any; // Allow for additional properties from the API
  };
}

// Interface for payment details API response
interface PaymentDetailApiResponse {
  payment_detail: {
    id: string;
    [key: string]: unknown;
  };
}

export const complianceRouter = router({
  submitComplianceInfo: publicProcedure
    .input(complianceFormSchema)
    .mutation(async ({ input }) => {
      try {
        const complianceEndpoint = "/v2/payer/compliance";

        const response = await apiClient.post(complianceEndpoint, input);

        return {
          success: true,
          data: response.data,
          message: "Compliance information submitted successfully",
        };
      } catch (error) {
        console.error("Compliance API error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to submit compliance information: ${error.message}`
              : "Failed to submit compliance information",
        });
      }
    }),

  updateAgreementStatus: protectedProcedure
    .input(
      z.object({
        clientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Make the API call to Request Network using apiClient
        const response = await apiClient.patch(
          `/v2/payer/compliance/${input.clientUserId}`,
          { agreementCompleted: true },
        );

        if (response.status !== 200) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              response.data?.message || "Failed to update agreement status",
          });
        }

        await ctx.db
          .update(userTable)
          .set({
            agreementStatus: "completed",
          })
          .where(eq(userTable.id, input.clientUserId));

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
    .query(async ({ input }): Promise<ComplianceStatusResponse> => {
      try {
        // Get the compliance status from Request Network
        try {
          const response = await apiClient.get(
            `/v2/payer/compliance/${input.clientUserId}`,
          );

          if (response.status !== 200) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                response.data?.message || "Failed to get compliance status",
            });
          }

          return {
            success: true,
            data: response.data,
          };
        } catch (error: unknown) {
          // If the user doesn't exist yet in the compliance system, return default status
          if (error instanceof AxiosError && error.response?.status === 404) {
            const defaultResponse: ComplianceStatusResponse = {
              success: true,
              data: {
                kycStatus: "not_started",
                agreementStatus: "not_started",
                isCompliant: false,
              },
            };
            return defaultResponse;
          }

          // Wrap API errors in a proper TRPCError
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? `API Error: ${error.message}`
                : "Failed to get compliance status from API",
          });
        }
      } catch (error) {
        console.error("Error getting compliance status:", error);

        // If error is already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to get compliance status: ${error.message}`
              : "Failed to get compliance status",
        });
      }
    }),

  // Procedure for creating bank account payment details for a user
  createPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        paymentDetailsData: bankAccountSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { userId, paymentDetailsData } = input;

        // Extract required fields and optional fields
        const {
          bankName,
          accountName,
          beneficiaryType,
          addressLine1,
          city,
          postalCode,
          country,
          currency,
          gender,
          // Extract other fields as needed
          ...otherFields
        } = paymentDetailsData;

        // Construct the record with required fields
        const paymentDetailsRecord = {
          id: ulid(),
          userId,
          bankName,
          accountName,
          beneficiaryType,
          addressLine1,
          city,
          postalCode,
          country,
          currency,
        };

        // Add optional fields that are defined
        const insertData = { ...paymentDetailsRecord };

        // Add gender only if it's a valid value
        if (
          gender &&
          ["male", "female", "other", "prefer_not_to_say"].includes(gender)
        ) {
          Object.assign(insertData, { gender });
        }

        // Add other fields if they're defined
        for (const [key, value] of Object.entries(otherFields)) {
          if (value !== undefined && value !== null) {
            Object.assign(insertData, { [key]: value });
          }
        }

        const paymentDetails = await ctx.db
          .insert(paymentDetailsTable)
          .values(insertData)
          .returning();

        return {
          success: true,
          message: "Payment details created successfully",
          paymentDetails: paymentDetails[0],
        };
      } catch (error) {
        console.error("Error creating payment details:", error);

        // Check for database-specific errors that could be made more user-friendly
        const errorMessage = error instanceof Error ? error.message : "";
        let code: "INTERNAL_SERVER_ERROR" | "BAD_REQUEST" | "CONFLICT" =
          "INTERNAL_SERVER_ERROR";
        let message = "Failed to create payment details";

        // Add specific error detection if needed
        if (
          errorMessage.includes("duplicate key") ||
          errorMessage.includes("unique constraint")
        ) {
          code = "CONFLICT";
          message = "Payment details with these values already exist";
        } else if (
          errorMessage.includes("validation") ||
          errorMessage.includes("constraint")
        ) {
          code = "BAD_REQUEST";
          message = "Invalid payment details provided";
        } else if (error instanceof Error) {
          message = `Failed to create payment details: ${error.message}`;
        }

        throw new TRPCError({
          code,
          message,
        });
      }
    }),

  // Procedure for allowing payers to use a payee's bank account details for invoice payments
  allowPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        paymentDetailsId: z.string(),
        payerEmail: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Extract payer_email from paymentDetails if it exists
        const { payerEmail, paymentDetailsId } = input;

        const payerUser = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.email, payerEmail),
        });

        if (!payerUser || !payerUser?.isCompliant) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payer user is not compliant",
          });
        }

        const paymentDetailsData =
          await ctx.db.query.paymentDetailsTable.findFirst({
            where: eq(paymentDetailsTable.id, paymentDetailsId),
          });

        if (!paymentDetailsData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment details not found",
          });
        }

        // Remove undefined and null values to avoid API validation errors
        const cleanedPaymentDetails = Object.fromEntries(
          Object.entries(paymentDetailsData).filter(
            ([_, v]) => v !== undefined && v !== null,
          ),
        );

        let response: AxiosResponse<PaymentDetailApiResponse>;
        try {
          response = await apiClient.post<PaymentDetailApiResponse>(
            `/v2/payer/payment-details/${encodeURIComponent(payerEmail)}`,
            cleanedPaymentDetails,
          );
        } catch (error: unknown) {
          console.error(
            "Error creating payment details:",
            error instanceof AxiosError
              ? JSON.stringify(error.response?.data)
              : error,
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? `API Error: ${error.message}`
                : "Failed to create payment details",
          });
        }

        await ctx.db.insert(paymentDetailsPayersTable).values({
          id: ulid(),
          paymentDetailsId: paymentDetailsId,
          payerId: payerUser.id,
          status: "pending",
          paymentDetailsIdReference: response.data?.payment_detail?.id,
        });

        return {
          success: true,
          paymentDetails: response.data.payment_detail,
          message: "Payment details allowed successfully",
        };
      } catch (error: unknown) {
        console.error(
          "Error allowing payment details:",
          error instanceof AxiosError
            ? JSON.stringify(error.response?.data)
            : error instanceof Error
              ? error.message
              : error,
        );

        // If error is already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }

        // Otherwise wrap it in a TRPCError
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to allow payment details: ${error.message}`
              : "Failed to allow payment details",
        });
      }
    }),

  // Procedure for retrieving all payment details associated with a user, including shared payment details
  getPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { userId } = input;

        // Get all payment details with their payers using a join
        const results = await ctx.db
          .select()
          .from(paymentDetailsTable)
          .leftJoin(
            paymentDetailsPayersTable,
            eq(
              paymentDetailsTable.id,
              paymentDetailsPayersTable.paymentDetailsId,
            ),
          )
          .leftJoin(
            userTable,
            eq(paymentDetailsPayersTable.payerId, userTable.id),
          )
          .where(eq(paymentDetailsTable.userId, userId));

        // Process the joined results into the desired structure
        const paymentDetailsMap = new Map();

        for (const row of results) {
          const paymentDetail = row.payment_details;
          if (!paymentDetailsMap.has(paymentDetail.id)) {
            paymentDetailsMap.set(paymentDetail.id, {
              paymentDetails: paymentDetail,
              paymentDetailsPayers: [],
            });
          }
          if (row.payment_details_payers) {
            paymentDetailsMap.get(paymentDetail.id)?.paymentDetailsPayers.push({
              ...row.payment_details_payers,
              ...(row.user ?? {}),
            });
          }
        }

        return {
          success: true,
          paymentDetails: Array.from(paymentDetailsMap.values()),
        };
      } catch (error) {
        console.error("Error getting payment details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to retrieve payment details: ${error.message}`
              : "Failed to retrieve payment details",
        });
      }
    }),

  // Procedure for retrieving a specific payment detail by its ID
  getPaymentDetailsById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user || !ctx.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access payment details",
          });
        }

        const paymentDetails = await ctx.db.query.paymentDetailsTable.findFirst(
          {
            where: eq(paymentDetailsTable.id, input),
          },
        );

        if (!paymentDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment details not found",
          });
        }
        return {
          success: true,
          paymentDetails: paymentDetails,
        };
      } catch (error) {
        console.error("Error getting payment details by ID:", error);

        // If error is already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to retrieve payment details by ID: ${error.message}`
              : "Failed to retrieve payment details by ID",
        });
      }
    }),

  getUserByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.email, input.email),
          columns: {
            id: true,
            email: true,
            name: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return user;
      } catch (error) {
        // If error is already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error finding user by email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to find user by email: ${error.message}`
              : "Failed to find user by email",
        });
      }
    }),
});
