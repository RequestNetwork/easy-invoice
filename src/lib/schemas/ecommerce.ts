import { isEthereumAddress } from "validator";
import { z } from "zod";

const feeValidation = (
  data: { feeAddress?: string; feePercentage?: string },
  ctx: z.RefinementCtx,
) => {
  const hasFeeAddress = data.feeAddress !== undefined;
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
    .transform((val) => (val === "" ? undefined : val))
    .refine((value) => {
      if (value === undefined) return true;
      return isEthereumAddress(value);
    }, "Invalid Ethereum address format")
    .optional(),
  feePercentage: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .refine((value) => {
      if (value === undefined) return true;
      const num = Number(value);

      return !Number.isNaN(num) && num >= 0 && num <= 100;
    }, "Fee percentage must be a number between 0 and 100")
    .optional(),
});

export const ecommerceClientApiSchema =
  baseEcommerceClientApiSchema.superRefine(feeValidation);

export const editecommerceClientApiSchema = baseEcommerceClientApiSchema
  .extend({
    id: z.string().min(1, "ID is required"),
  })
  .superRefine(feeValidation);
