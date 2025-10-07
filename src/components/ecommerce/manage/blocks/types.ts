import { ecommerceClientApiSchema } from "@/lib/schemas/ecommerce";
import type { z } from "zod";

export const ecommerceClientFormSchema = ecommerceClientApiSchema;

export type EcommerceClientFormValues = z.infer<
  typeof ecommerceClientFormSchema
>;
