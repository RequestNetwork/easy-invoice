import { isEthereumAddress } from "validator";
import { z } from "zod";

export const clientIdApiSchema = z.object({
  label: z.string().min(1, "Label is required"),
  domain: z.string().url(),
  feeAddress: z
    .string()
    .min(1, "Fee address is required")
    .refine(isEthereumAddress, "Invalid Ethereum address format")
    .optional(),
  feePercentage: z.coerce
    .number()
    .min(0, "Fee percentage must be at least 0")
    .max(100, "Fee percentage cannot exceed 100")
    .optional(),
});
