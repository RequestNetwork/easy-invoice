import { apiClient } from "@/lib/axios";
import { PaymentDetailsStatus } from "@/lib/constants/bank-account";
import { Gender } from "@/lib/constants/compliance";
import { bankAccountSchema } from "@/lib/schemas/bank-account";
import { complianceFormSchema } from "@/lib/schemas/compliance";
import { filterDefinedValues } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { AxiosError, type AxiosResponse } from "axios";
import { eq, inArray } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import {
  paymentDetailsPayersTable,
  paymentDetailsTable,
  userTable,
} from "../db/schema";
import { protectedProcedure, router } from "../trpc";

// Define interfaces for consistent return types
interface ComplianceStatusResponse {
  success: boolean;
  data: {
    kycStatus: string;
    agreementStatus: string;
    isCompliant: boolean;
    [key: string]: unknown; // More type-safe approach for additional API properties
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
  submitComplianceInfo: protectedProcedure
    .input(complianceFormSchema)
    .mutation(async ({ input }) => {
      try {
        const complianceEndpoint = "/v2/payer";

        const response = await apiClient.post(complianceEndpoint, input);

        return {
          success: true,
          data: response.data,
          message: "Compliance information submitted successfully",
        };
      } catch (error) {
        console.error("Error submitting compliance info:", error);

        // Determine the appropriate error code based on the error type
        if (error instanceof AxiosError) {
          const status = error.response?.status;

          // Client-side errors
          if (status === 400 || status === 422) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                error.response?.data?.message ||
                "Invalid compliance information provided",
            });
          }

          // Authentication/Authorization errors
          if (status === 401 || status === 403) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                error.response?.data?.message ||
                "Not authorized to submit compliance information",
            });
          }

          // Resource not found
          if (status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                error.response?.data?.message ||
                "Compliance resource not found",
            });
          }
        }

        // Default to INTERNAL_SERVER_ERROR for other errors
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
          `/v2/payer/${encodeURIComponent(input.clientUserId)}`,
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
          .where(eq(userTable.email, input.clientUserId));

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
            `/v2/payer/${encodeURIComponent(input.clientUserId)}`,
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
                agreementUrl: null,
                kycUrl: null,
                userId: null,
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
        if (gender && Object.values(Gender).includes(gender as Gender)) {
          Object.assign(insertData, { gender });
        }

        // Add other fields if they're defined
        Object.assign(insertData, filterDefinedValues(otherFields));

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
        } else if (errorMessage.includes("validation")) {
          code = "BAD_REQUEST";
          message = "Invalid payment details provided";
        } else if (errorMessage.includes("constraint")) {
          // Constraint errors may indicate server-side issues and not just client input
          code = "INTERNAL_SERVER_ERROR";
          message = "Server error: database constraint violation";
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

        if (!payerUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payer user not found",
          });
        }

        if (!payerUser.isCompliant) {
          throw new TRPCError({
            code: "FORBIDDEN",
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
        const cleanedPaymentDetails = filterDefinedValues(paymentDetailsData);

        let response: AxiosResponse<PaymentDetailApiResponse>;
        try {
          response = await apiClient.post<PaymentDetailApiResponse>(
            `/v2/payer/${encodeURIComponent(payerEmail)}/payment-details`,
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
          status: PaymentDetailsStatus.PENDING,
          externalPaymentDetailId: response.data?.payment_detail?.id,
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

        // Map API client errors to appropriate error codes
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          // Map client errors (400, 422) to BAD_REQUEST
          if (status === 400 || status === 422) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                error.response?.data?.message ||
                "Invalid payment details provided",
            });
          }
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

  // Procedure for retrieving all payment details owned by a user, whether or not they're linked to payers
  getPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { userId } = input;

        // First get all payment details owned by the user
        const ownedPaymentDetails =
          await ctx.db.query.paymentDetailsTable.findMany({
            where: eq(paymentDetailsTable.userId, userId),
          });

        // Initialize the map with all owned payment details (ensures we include those with no payers)
        const paymentDetailsMap = new Map();
        for (const detail of ownedPaymentDetails) {
          paymentDetailsMap.set(detail.id, {
            paymentDetails: detail,
            paymentDetailsPayers: [],
          });
        }

        // Now get payer information for the payment details that have payers
        if (ownedPaymentDetails.length > 0) {
          const paymentDetailIds = ownedPaymentDetails.map(
            (detail) => detail.id,
          );

          const results = await ctx.db
            .select()
            .from(paymentDetailsPayersTable)
            .leftJoin(
              userTable,
              eq(paymentDetailsPayersTable.payerId, userTable.id),
            )
            .where(
              inArray(
                paymentDetailsPayersTable.paymentDetailsId,
                paymentDetailIds,
              ),
            );

          // Process the results to add payers to the map
          for (const row of results) {
            const paymentDetailId =
              row.payment_details_payers?.paymentDetailsId;
            if (paymentDetailId && paymentDetailsMap.has(paymentDetailId)) {
              const entry = paymentDetailsMap.get(paymentDetailId);
              if (entry && row.payment_details_payers) {
                entry.paymentDetailsPayers.push({
                  ...row.payment_details_payers,
                  ...(row.user ?? {}),
                });
              }
            }
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

        // Since this is a protected procedure, ctx.user should exist, but we'll check to satisfy TypeScript
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access payment details",
          });
        }

        // Authorization check: Allow access if the user is either the OWNER OR an authorized PAYER
        if (paymentDetails.userId !== ctx.user?.id) {
          // User is not the owner, so check if they are an authorized payer
          const payerAccess =
            await ctx.db.query.paymentDetailsPayersTable.findFirst({
              where: (payers) =>
                eq(payers.payerId, ctx.user?.id ?? "") &&
                eq(payers.paymentDetailsId, input),
            });

          // If the user is not an authorized payer either, deny access
          if (!payerAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are not authorized to access these payment details",
            });
          }
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
            isCompliant: true,
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
