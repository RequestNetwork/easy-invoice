import type { RecurringPaymentInstallment, Request } from "@/server/db/schema";
import type { ConversionInfo, SubscriptionPayment } from "../types";

export type PaymentItem = {
  amount: string;
  currency: string;
  conversionInfo: ConversionInfo | null;
};

export function convertRequestToPaymentItem(request: Request): PaymentItem {
  return {
    amount: request.amount,
    currency: request.invoiceCurrency,
    conversionInfo: request.conversionInfo,
  };
}

export function convertRecurringPaymentInstallmentToPaymentItem(
  recurringPaymentAmount: string,
  recurringPaymentCurrency: string,
  installment: RecurringPaymentInstallment,
): PaymentItem {
  return {
    amount: recurringPaymentAmount,
    currency: recurringPaymentCurrency,
    conversionInfo: installment.conversionInfo,
  };
}

export function convertSubscriptionPaymentToPaymentItem(
  subscriptionPayment: SubscriptionPayment,
): PaymentItem {
  return {
    amount: subscriptionPayment.amount,
    currency: subscriptionPayment.currency,
    conversionInfo: subscriptionPayment.conversionInfo,
  };
}

const STABLECOINS = ["USDC", "USDT", "DAI", "USDCE", "fUSDC", "fUSDT", "FAU"]; // We add sepolia currencies for testing

export function isStablecoin(currency: string): boolean {
  const symbol = currency.split("-")[0];
  return STABLECOINS.includes(symbol);
}

interface ConsolidatePaymentValuesResult {
  totalInUsd: string;
  hasNonUsdValues: boolean;
}
function consolidatePaymentUsdValues(
  payments: PaymentItem[],
): ConsolidatePaymentValuesResult {
  return {
    totalInUsd: payments
      .reduce((acc, item) => {
        if (item.currency === "USD" || isStablecoin(item.currency)) {
          return acc + Number(item.amount);
        }

        if (item.conversionInfo) {
          return acc + Number(item.conversionInfo.convertedAmountDestination);
        }

        return acc;
      }, 0)
      .toFixed(2),
    hasNonUsdValues: payments.some(
      (item) => item.currency !== "USD" && !isStablecoin(item.currency),
    ),
  };
}

export function consolidateRequestUsdValues(
  requests: Request[],
): ConsolidatePaymentValuesResult {
  const paymentItems = requests.map(convertRequestToPaymentItem);

  return consolidatePaymentUsdValues(paymentItems);
}

export function consolidateSubscriptionPaymentUsdValues(
  subscriptionPayments: SubscriptionPayment[],
): ConsolidatePaymentValuesResult {
  const paymentItems = subscriptionPayments.map(
    convertSubscriptionPaymentToPaymentItem,
  );

  return consolidatePaymentUsdValues(paymentItems);
}

export function consolidateRecurringPaymentUsdValues(
  recurringPaymentAmount: string,
  recurringPaymentCurrency: string,
  installments: RecurringPaymentInstallment[],
): ConsolidatePaymentValuesResult {
  const paymentItems = installments.map((installment) =>
    convertRecurringPaymentInstallmentToPaymentItem(
      recurringPaymentAmount,
      recurringPaymentCurrency,
      installment,
    ),
  );

  return consolidatePaymentUsdValues(paymentItems);
}
