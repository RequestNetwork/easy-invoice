import { z } from "zod";

export const complianceFormSchema = z.object({
  clientUserId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  beneficiaryType: z.enum(["individual", "business"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Date must be in format MM/DD/YYYY"),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(1, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  nationality: z.string().min(2, "Nationality is required"),
  phone: z.string().min(1, "Phone number is required"),
  ssn: z.string(),
});

export type ComplianceFormValues = z.infer<typeof complianceFormSchema>;
