import { z } from "zod";

export enum BeneficiaryType {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
}

// ISO 3166-1 alpha-2 country codes
export const COUNTRY_CODES = [
  "AF",
  "AL",
  "DZ",
  "AS",
  "AD",
  "AO",
  "AI",
  "AQ",
  "AG",
  "AR",
  "AM",
  "AW",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BM",
  "BT",
  "BO",
  "BA",
  "BW",
  "BV",
  "BR",
  "IO",
  "BN",
  "BG",
  "BF",
  "BI",
  "KH",
  "CM",
  "CA",
  "CV",
  "KY",
  "CF",
  "TD",
  "CL",
  "CN",
  "CX",
  "CC",
  "CO",
  "KM",
  "CG",
  "CD",
  "CK",
  "CR",
  "CI",
  "HR",
  "CU",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "ET",
  "FK",
  "FO",
  "FJ",
  "FI",
  "FR",
  "GF",
  "PF",
  "TF",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GI",
  "GR",
  "GL",
  "GD",
  "GP",
  "GU",
  "GT",
  "GN",
  "GW",
  "GY",
  "HT",
  "HM",
  "VA",
  "HN",
  "HK",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IL",
  "IT",
  "JM",
  "JP",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MO",
  "MK",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MQ",
  "MR",
  "MU",
  "YT",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "MS",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NC",
  "NZ",
  "NI",
  "NE",
  "NG",
  "NU",
  "NF",
  "MP",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PN",
  "PL",
  "PT",
  "PR",
  "QA",
  "RE",
  "RO",
  "RU",
  "RW",
  "SH",
  "KN",
  "LC",
  "PM",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "SC",
  "SL",
  "SG",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "GS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SJ",
  "SZ",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TK",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TC",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UM",
  "UY",
  "UZ",
  "VU",
  "VE",
  "VN",
  "VG",
  "VI",
  "WF",
  "EH",
  "YE",
  "ZM",
  "ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

// Postal code validation patterns by country
export const POSTAL_CODE_PATTERNS: Record<
  string,
  { pattern: RegExp; example: string }
> = {
  // Default pattern for countries not explicitly listed
  DEFAULT: { pattern: /.+/, example: "Any format" },
  // North America
  US: { pattern: /^\d{5}(-\d{4})?$/, example: "12345 or 12345-6789" },
  CA: { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, example: "A1A 1A1" },
  MX: { pattern: /^\d{5}$/, example: "12345" },
  // Europe
  GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/, example: "AA1 1AA" },
  DE: { pattern: /^\d{5}$/, example: "12345" },
  FR: { pattern: /^\d{5}$/, example: "12345" },
  IT: { pattern: /^\d{5}$/, example: "12345" },
  ES: { pattern: /^\d{5}$/, example: "12345" },
  NL: { pattern: /^\d{4} ?[A-Z]{2}$/, example: "1234 AB" },
  BE: { pattern: /^\d{4}$/, example: "1234" },
  PT: { pattern: /^\d{4}-\d{3}$/, example: "1234-123" },
  CH: { pattern: /^\d{4}$/, example: "1234" },
  AT: { pattern: /^\d{4}$/, example: "1234" },
  // Asia
  JP: { pattern: /^\d{3}-\d{4}$/, example: "123-4567" },
  CN: { pattern: /^\d{6}$/, example: "123456" },
  IN: { pattern: /^\d{6}$/, example: "123456" },
  SG: { pattern: /^\d{6}$/, example: "123456" },
  // Oceania
  AU: { pattern: /^\d{4}$/, example: "1234" },
  NZ: { pattern: /^\d{4}$/, example: "1234" },
  // South America
  BR: { pattern: /^\d{5}-\d{3}$/, example: "12345-678" },
  AR: { pattern: /^[A-Z]\d{4}[A-Z]{3}$/, example: "A1234ABC" },
};

/**
 * Validates a postal code based on the country
 */
export const validatePostalCode = (
  postcode: string,
  country: CountryCode,
): boolean => {
  const countryPattern =
    POSTAL_CODE_PATTERNS[country] || POSTAL_CODE_PATTERNS.DEFAULT;
  return countryPattern.pattern.test(postcode);
};

// Define the basic schema type without refinements
const baseFormSchema = z.object({
  clientUserId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  beneficiaryType: z.nativeEnum(BeneficiaryType),
  companyName: z.string().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .describe("Date of birth in YYYY-MM-DD format"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(1, "Postcode is required"),
  country: z
    .string()
    .refine((val) => COUNTRY_CODES.includes(val as CountryCode), {
      message: "Country must be a valid ISO 3166-1 alpha-2 code",
    }),
  nationality: z
    .string()
    .refine((val) => COUNTRY_CODES.includes(val as CountryCode), {
      message: "Nationality must be a valid ISO 3166-1 alpha-2 code",
    }),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format (e.g., +12025550123)",
    ),
  ssn: z.string(),
  sourceOfFunds: z.string().optional(),
  businessActivity: z.string().optional(),
});

// Export the schema with all refinements
export const complianceFormSchema = baseFormSchema
  // Validate companyName for businesses
  .refine(
    (data) =>
      !(data.beneficiaryType === BeneficiaryType.BUSINESS && !data.companyName),
    {
      message: "Company name is required for business beneficiaries",
      path: ["companyName"],
    },
  )
  // Validate sourceOfFunds for businesses
  .refine(
    (data) =>
      !(
        data.beneficiaryType === BeneficiaryType.BUSINESS && !data.sourceOfFunds
      ),
    {
      message: "Source of funds is required for business beneficiaries",
      path: ["sourceOfFunds"],
    },
  )
  // Validate businessActivity for businesses
  .refine(
    (data) =>
      !(
        data.beneficiaryType === BeneficiaryType.BUSINESS &&
        !data.businessActivity
      ),
    {
      message: "Business activity is required for business beneficiaries",
      path: ["businessActivity"],
    },
  )
  .refine(
    (data) => {
      // SSN is required for US citizens or residents
      if ((data.country === "US" || data.nationality === "US") && !data.ssn) {
        return false;
      }
      return true;
    },
    {
      message: "SSN is required for US citizens or residents",
      path: ["ssn"],
    },
  )
  .refine(
    (data) => {
      // Validate postcode format based on the selected country
      return validatePostalCode(data.postcode, data.country as CountryCode);
    },
    {
      message: "Invalid postal code format for the selected country",
      path: ["postcode"],
    },
  );

export type ComplianceFormValues = z.infer<typeof complianceFormSchema>;
