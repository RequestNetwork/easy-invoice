import type { RecurringPayment } from "@/server/db/schema";

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
  planName: string;
  txHash: string;
  createdAt: Date;
  requestScanUrl?: string;
  chain: string;
  subscriber: string;
};
