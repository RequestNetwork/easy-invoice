import { isEthereumAddress } from "validator";
import { z } from "zod";

const feeValidation = (
  data: { feeAddress?: string; feePercentage?: number },
  ctx: z.RefinementCtx,
) => {
  const hasFeeAddress = data.feeAddress !== undefined && data.feeAddress !== "";
  const hasFeePercentage = data.feePercentage !== undefined;

  if (hasFeeAddress && !hasFeePercentage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fee percentage is required when fee address is provided",
      path: ["feePercentage"],
    });
  }

  if (hasFeePercentage && !hasFeeAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fee address is required when fee percentage is provided",
      path: ["feeAddress"],
    });
  }
};

const baseEcommerceClientApiSchema = z.object({
  label: z.string().min(1, "Label is required"),
  domain: z.string().url(),
  feeAddress: z
    .string()
    .refine((value) => {
      if (value === undefined || value === "") return true;

      return isEthereumAddress(value);
    }, "Invalid Ethereum address format")
    .optional(),
  feePercentage: z.coerce
    .number()
    .min(0, "Fee percentage must be at least 0")
    .max(100, "Fee percentage cannot exceed 100")
    .optional(),
});

export const ecommerceClientApiSchema =
  baseEcommerceClientApiSchema.superRefine(feeValidation);

export const editecommerceClientApiSchema = baseEcommerceClientApiSchema
  .extend({
    id: z.string().min(1, "ID is required"),
  })
  .superRefine(feeValidation);
