import { z } from "zod";

export const bankAccountSchema = z
  .object({
    // Core required fields for all currencies
    bankName: z.string().min(1, "Bank name is required"),
    accountName: z.string().min(1, "Account name is required"),
    beneficiaryType: z.enum(["individual", "business"]),
    currency: z.string().min(3).max(3).default("usd"),
    addressLine1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(2).max(2).default("US"),

    // Fields that may be required based on currency/rails
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    rails: z.enum(["local", "swift", "wire"]).default("local"),
    addressLine2: z.string().optional(),
    state: z.string().optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .describe("Date of birth in YYYY-MM-DD format"),
    sortCode: z.string().optional(),
    iban: z.string().optional(),
    swiftBic: z.string().optional(),
    documentNumber: z.string().optional(),
    documentType: z.string().optional(),
    accountType: z.enum(["checking", "savings"]).default("checking"),
    ribNumber: z.string().optional(),
    bsbNumber: z.string().optional(),
    ncc: z.string().optional(),
    branchCode: z.string().optional(),
    bankCode: z.string().optional(),
    ifsc: z.string().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be in E.164 format")
      .optional(),
    businessActivity: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.string().optional(),
  })
  .refine(
    (data) => !(data.beneficiaryType === "individual" && !data.dateOfBirth),
    {
      message: "Date of birth is required for individual beneficiaries",
      path: ["dateOfBirth"],
    },
  )
  .refine((data) => !(data.country === "US" && !data.state), {
    message: "State is required when country is US",
    path: ["state"],
  })
  .refine(
    (data) => {
      // USD specific validations
      if (data.currency === "usd") {
        if (data.rails === "swift") {
          return !!data.swiftBic && (!!data.iban || !!data.accountNumber);
        }
        return !!data.accountNumber && !!data.routingNumber;
      }
      return true;
    },
    {
      message:
        "For USD, account number and routing number are required (or SWIFT BIC and IBAN for swift rails)",
      path: ["accountNumber"],
    },
  )
  .refine(
    (data) => {
      // EUR specific validations
      if (data.currency === "eur") {
        return !!data.iban && (data.rails !== "swift" || !!data.swiftBic);
      }
      return true;
    },
    {
      message: "For EUR, IBAN is required (and SWIFT BIC for swift rails)",
      path: ["iban"],
    },
  )
  .refine(
    (data) => {
      // GBP specific validations
      if (data.currency === "gbp") {
        return !!data.iban && !!data.swiftBic;
      }
      return true;
    },
    {
      message: "For GBP, IBAN and SWIFT BIC are required",
      path: ["iban"],
    },
  )
  .refine(
    (data) => {
      // INR specific validations
      if (data.currency === "inr") {
        return !!data.accountNumber && !!data.swiftBic && !!data.ifsc;
      }
      return true;
    },
    {
      message: "For INR, account number, SWIFT BIC, and IFSC are required",
      path: ["accountNumber"],
    },
  );

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
