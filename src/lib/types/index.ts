import type { RecurringPayment } from "@/server/db/schema";
import type { ecommerceRouter } from "@/server/routers/ecommerce";
import type { inferRouterOutputs } from "@trpc/server";

export interface PaymentRoute {
  id: string;
  fee: number;
  speed: number | "FAST";
  price_impact: number;
  chain: string;
  token: string;
  isCryptoToFiat?: boolean;
  platformFee?: number;
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
};

export type ClientPaymentWithEcommerceClient = inferRouterOutputs<
  typeof ecommerceRouter
>["getAllClientPayments"][number];
