import type { CountryOption } from "./countries";

export const COMPLIANCE_COUNTRIES: CountryOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgium" },
  { value: "BR", label: "Brazil" },
  { value: "CN", label: "China" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "GR", label: "Greece" },
  { value: "HK", label: "Hong Kong" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IE", label: "Ireland" },
  { value: "IT", label: "Italy" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "LU", label: "Luxembourg" },
  { value: "MY", label: "Malaysia" },
  { value: "MX", label: "Mexico" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NO", label: "Norway" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "RU", label: "Russia" },
  { value: "SG", label: "Singapore" },
  { value: "ZA", label: "South Africa" },
  { value: "ES", label: "Spain" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "TW", label: "Taiwan" },
  { value: "TH", label: "Thailand" },
  { value: "TR", label: "Turkey" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "VN", label: "Vietnam" },
];

/**
 * Enum representing the possible gender options for compliance forms
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}
