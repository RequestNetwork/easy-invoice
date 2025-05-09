import { z } from "zod";

export const supportedCurrencies = ["usd", "eur", "gbp", "inr"] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

// ISO 3166-1 alpha-2 country codes
export const countryCodes = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW",
] as const;

// Define named refinement functions for better readability
// These functions handle the currency-specific validations

/**
 * Validates that individual beneficiaries have a date of birth
 */
const validateIndividualDateOfBirth = (data: any) => {
  return !(data.beneficiaryType === "individual" && !data.dateOfBirth);
};

/**
 * Validates that US addresses include a state
 */
const validateUSState = (data: any) => {
  return !(data.country === "US" && !data.state);
};

/**
 * Validates USD account requirements based on the rails type
 */
const validateUSD = (data: any) => {
  if (data.currency !== "usd") return true;

  // For SWIFT transfers, require SWIFT/BIC and either IBAN or account number
  if (data.rails === "swift") {
    if (!data.swiftBic) return false;
    if (!data.iban && !data.accountNumber) return false;
    return true;
  }

  // For local/wire transfers, require account number and routing number
  return !!data.accountNumber && !!data.routingNumber;
};

/**
 * Validates EUR account requirements based on the rails type
 */
const validateEUR = (data: any) => {
  if (data.currency !== "eur") return true;

  return !!data.iban && (data.rails !== "swift" || !!data.swiftBic);
};

/**
 * Validates GBP account requirements
 */
const validateGBP = (data: any) => {
  if (data.currency !== "gbp") return true;

  // For SWIFT transfers, require IBAN and SWIFT/BIC
  if (data.rails === "swift") {
    return !!data.iban && !!data.swiftBic;
  }

  // For local/faster payments, require sort code and account number
  return !!data.sortCode && !!data.accountNumber;
};

/**
 * Validates INR account requirements
 */
const validateINR = (data: any) => {
  if (data.currency !== "inr") return true;

  return !!data.accountNumber && !!data.swiftBic && !!data.ifsc;
};

export const bankAccountSchema = z
  .object({
    // Core required fields for all currencies
    bankName: z.string().min(1, "Bank name is required"),
    accountName: z.string().min(1, "Account name is required"),
    beneficiaryType: z.enum(["individual", "business"]),
    currency: z.enum(supportedCurrencies).default("usd"),
    addressLine1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z
      .enum(countryCodes)
      .default("US")
      .describe("ISO 3166-1 alpha-2 country code"),

    // Fields that may be required based on currency/rails
    accountNumber: z
      .string()
      .regex(/^\d+$/, "Account number must contain only digits")
      .optional(),
    routingNumber: z
      .string()
      .regex(/^\d{9}$/, "Routing number must be 9 digits")
      .optional(),
    rails: z.enum(["local", "swift", "wire"]).default("local"),
    addressLine2: z.string().optional(),
    state: z.string().optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .describe("Date of birth in YYYY-MM-DD format")
      .optional(),
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
  // Apply all the named refinement functions
  .refine(validateIndividualDateOfBirth, {
    message: "Date of birth is required for individual beneficiaries",
    path: ["dateOfBirth"],
  })
  .refine(validateUSState, {
    message: "State is required when country is US",
    path: ["state"],
  })
  .refine(validateUSD, {
    message:
      "For USD with SWIFT rails: SWIFT/BIC code and either IBAN or account number are required. For local/wire rails: account number and routing number are required.",
    path: [], // Point to root level since multiple fields could be missing
  })
  .refine(validateEUR, {
    message: "For EUR, IBAN is required (and SWIFT BIC for swift rails)",
    path: ["iban"],
  })
  .refine(validateGBP, {
    message:
      "For GBP with SWIFT rails: IBAN and SWIFT BIC are required. For local payments: sort code and account number are required.",
    path: [], // Point to root level since multiple fields could be missing
  })
  .refine(validateINR, {
    message: "For INR, account number, SWIFT BIC, and IFSC are required",
    path: [], // Point to root level since multiple fields could be missing
  });

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
