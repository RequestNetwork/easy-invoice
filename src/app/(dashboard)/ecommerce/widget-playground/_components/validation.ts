import isEthereumAddress from "validator/lib/isEthereumAddress";
import z from "zod";

export const PlaygroundValidation = z.object({
  // Payment basics
  amountInUsd: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid USD amount (e.g., 10 or 10.50)")
    .refine((v) => Number.parseFloat(v) > 0, "Amount must be > 0"),
  recipientWallet: z
    .string()
    .min(1, "Recipient wallet is required")
    .refine(isEthereumAddress, "Invalid Ethereum address format"),

  // Payment config
  paymentConfig: z.object({
    walletConnectProjectId: z.string().optional(),
    reference: z.string().optional(),
    rnApiClientId: z.string().min(1, "API Client ID is required"),
    feeInfo: z
      .object({
        feePercentage: z.string(),
        feeAddress: z
          .string()
          .refine(isEthereumAddress, "Invalid Ethereum address format"),
      })
      .optional(),
    supportedCurrencies: z
      .array(z.string())
      .min(1, "At least one supported currency is required"),
  }),

  // UI config
  uiConfig: z
    .object({
      showRequestScanUrl: z.boolean().optional(),
      showReceiptDownload: z.boolean().optional(),
    })
    .optional(),

  // Receipt info
  receiptInfo: z.object({
    buyerInfo: z.object({
      email: z.string().email("Invalid email address"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      businessName: z.string().optional(),
      phone: z.string().optional(),
      address: z
        .object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          country: z.string(),
          postalCode: z.string(),
        })
        .optional(),
    }),
    companyInfo: z.object({
      name: z.string().min(1, "Company name is required"),
      address: z
        .object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        })
        .optional(),
      taxId: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
    }),
    items: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.string(),
        discount: z.string().optional(),
        tax: z.string().optional(),
        total: z.string(),
        currency: z.string().optional(),
      }),
    ),
    totals: z.object({
      totalDiscount: z.string(),
      totalTax: z.string(),
      total: z.string(),
      totalUSD: z.string(),
    }),
    invoiceNumber: z.string().optional(),
  }),
});

export type PlaygroundFormData = z.infer<typeof PlaygroundValidation>;
