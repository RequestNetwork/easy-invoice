import { apiClient } from "@/lib/axios";
import {
  type BankAccountFormValues,
  bankAccountSchema,
} from "@/lib/schemas/bank-account";
import { complianceFormSchema } from "@/lib/schemas/compliance";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { z } from "zod";
import { db } from "../db";
import {
  paymentDetailsPayersTable,
  paymentDetailsTable,
  userTable,
} from "../db/schema";
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

  // New procedure for creating payment details
  createPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        paymentDetailsData: bankAccountSchema,
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { userId, paymentDetailsData } = input;
        // Filter out undefined values before inserting
        const filteredData = Object.fromEntries(
          Object.entries(paymentDetailsData).filter(
            ([_, v]) => v !== undefined,
          ),
        ) as BankAccountFormValues;

        const paymentDetails = await db
          .insert(paymentDetailsTable)
          .values({
            id: ulid(),
            userId: userId,
            ...filteredData, // Include all other optional fields
          })
          .returning();

        return {
          success: true,
          message: "Payment details created successfully",
          paymentDetails: paymentDetails[0],
        };
      } catch (error) {
        console.error("Error creating payment details:", error);
      }
    }),

  // New procedure for allowing payers to pay invoices using payees payment details
  allowPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        paymentDetailsId: z.string(),
        payerEmail: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Extract payer_email from paymentDetails if it exists
        const { payerEmail, paymentDetailsId } = input;

        const payerUser = await db.query.userTable.findFirst({
          where: eq(userTable.email, payerEmail),
        });

        if (!payerUser || !payerUser?.isCompliant) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payer user is not compliant",
          });
        }

        const paymentDetailsData = await db.query.paymentDetailsTable.findFirst(
          {
            where: eq(paymentDetailsTable.id, paymentDetailsId),
          },
        );

        if (!paymentDetailsData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment details not found",
          });
        }

        // Format the data according to API requirements
        const formattedPaymentDetails = {
          bank_name: paymentDetailsData.bankName,
          account_name: paymentDetailsData.accountName,
          beneficiary_type: paymentDetailsData.beneficiaryType,
          address_line1: paymentDetailsData.addressLine1,
          date_of_birth: paymentDetailsData.dateOfBirth,
          postal_code: paymentDetailsData.postalCode,
          city: paymentDetailsData.city,
          country: paymentDetailsData.country,
          currency: paymentDetailsData.currency,
          rails: paymentDetailsData.rails || "local",

          // Optional fields - include all possible fields from the schema
          account_number: paymentDetailsData.accountNumber,
          routing_number: paymentDetailsData.routingNumber,
          account_type: paymentDetailsData.accountType,
          sort_code: paymentDetailsData.sortCode,
          iban: paymentDetailsData.iban,
          swift_bic: paymentDetailsData.swiftBic,
          document_number: paymentDetailsData.documentNumber,
          document_type: paymentDetailsData.documentType,
          rib_number: paymentDetailsData.ribNumber,
          bsb_number: paymentDetailsData.bsbNumber,
          ncc: paymentDetailsData.ncc,
          branch_code: paymentDetailsData.branchCode,
          bank_code: paymentDetailsData.bankCode,
          ifsc: paymentDetailsData.ifsc,
          address_line2: paymentDetailsData.addressLine2,
          state: paymentDetailsData.state,
          phone: paymentDetailsData.phone,
          neighbourhood: paymentDetailsData.neighbourhood,
          activity: paymentDetailsData.activity,
          nationality: paymentDetailsData.nationality,
          gender: paymentDetailsData.gender,
        };

        // Remove undefined values to avoid API validation errors
        const cleanedPaymentDetails = Object.fromEntries(
          Object.entries(formattedPaymentDetails).filter(
            ([_, v]) => v !== undefined,
          ),
        );

        let response: any;
        try {
          response = await apiClient.post(
            `/v1/payer/payment-details/${payerEmail}`,
            cleanedPaymentDetails,
          );
        } catch (error: any) {
          console.error(
            "Error creating payment details:",
            JSON.stringify(error?.response?.data),
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Failed to create payment details",
          });
        }

        await db.insert(paymentDetailsPayersTable).values({
          id: ulid(),
          paymentDetailsId: paymentDetailsId,
          payerId: payerUser.id,
          status: "pending",
          paymentDetailsReference: response?.data?.payment_detail?.id,
        });

        return {
          success: true,
          paymentDetails: response?.data?.payment_detail,
          message: "Payment details allowed successfully",
        };
      } catch (error: any) {
        console.error(
          "Error creating payment details:",
          JSON.stringify(error?.response?.data),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create payment details",
        });
      }
    }),

  // Updated procedure for getting payment details
  getPaymentDetails: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { userId } = input;

        // Get all payment details with their payers using a join
        const results = await db
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
              ...row.user,
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
              ? error.message
              : "Failed to get payment details",
        });
      }
    }),

  // New procedure for getting payment details by ID
  getPaymentDetailsById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      try {
        const paymentDetails = await db.query.paymentDetailsTable.findFirst({
          where: eq(paymentDetailsTable.id, input),
        });

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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get payment details by ID",
        });
      }
    }),
});
