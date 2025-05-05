import { z } from "zod";

export enum BeneficiaryType {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
}

export const complianceFormSchema = z
  .object({
    clientUserId: z.string().min(1, "User ID is required"),
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    beneficiaryType: z.nativeEnum(BeneficiaryType),
    companyName: z.string().optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postcode: z.string().min(1, "Postcode is required"),
    country: z.string().length(2, "Country must be a 2-letter code"),
    nationality: z.string().length(2, "Nationality must be a 2-letter code"),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be in E.164 format"),
    ssn: z.string().min(1, "Social Security Number is required"),
    sourceOfFunds: z.string().optional(),
    businessActivity: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate that companyName is provided for businesses
      if (
        data.beneficiaryType === BeneficiaryType.BUSINESS &&
        !data.companyName
      ) {
        return false;
      }

      // Validate that sourceOfFunds and businessActivity are provided for businesses
      if (
        data.beneficiaryType === BeneficiaryType.BUSINESS &&
        (!data.sourceOfFunds || !data.businessActivity)
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Missing required fields based on beneficiary type",
      path: ["beneficiaryType"],
    },
  );

export type ComplianceFormValues = z.infer<typeof complianceFormSchema>;
