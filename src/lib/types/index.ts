import type { RecurringPayment } from "@/server/db/schema";
import type { ecommerceRouter } from "@/server/routers/ecommerce";
import type { inferRouterOutputs } from "@trpc/server";

export interface PaymentRoute {
  id: string;
  fee: number;
  feeInUSD: number;
  speed: number | "FAST";
  price_impact: number;
  chain: string;
  token: string;
  isCryptoToFiat?: boolean;
  platformFee?: number;
  feeBreakdown?: {
    type: "gas" | "crosschain" | "platform" | "protocol";
    stage: "sending" | "overall";
    provider: string;
    amount: string;
    amountInUSD: string;
    amountInGwei?: string | null;
    currency: string;
    network: string;
    rateProvider?: string;
    receiverAddress?: string;
  }[];
}

export type SubscriptionWithDetails = RecurringPayment & {
  subscription: {
    label: string;
    id: string;
    trialDays: number;
  } | null;
};

export type SubscriptionPayment = {
  id: string;
  amount: string;
  currency: string;
  planId: string;
  planName: string;
  txHash: string;
  createdAt: Date;
  requestScanUrl?: string;
  chain: string;
  subscriber: string;
  totalNumberOfPayments: number;
  paymentNumber: number;
  conversionInfo: ConversionInfo | null;
};

export type ClientPaymentWithEcommerceClient = inferRouterOutputs<
  typeof ecommerceRouter
>["getAllClientPayments"][number];

export interface ConversionInfo {
  conversionRate: string;
  convertedAmountSource: string;
  convertedAmountDestination: string;
  conversionRateSource: string;
  conversionRateDestination: string;
  rateProvider: string;
}
