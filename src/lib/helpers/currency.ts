import { BigNumber, utils } from "ethers";

interface PaymentItem {
  amount: string;
  currency: string;
}

export function calculateTotalsByCurrency(
  items: PaymentItem[],
): Record<string, string> {
  const totals = items.reduce(
    (acc, item) => {
      const currency = item.currency;
      try {
        const amount = utils.parseUnits(item.amount, 18);
        if (!acc[currency]) {
          acc[currency] = BigNumber.from("0");
        }
        acc[currency] = acc[currency].add(amount);
      } catch (error) {
        console.error("Error calculating total:", error);
      }
      return acc;
    },
    {} as Record<string, BigNumber>,
  );

  return Object.entries(totals).reduce(
    (acc, [currency, amount]) => {
      acc[currency] = utils.formatUnits(amount, 18);
      return acc;
    },
    {} as Record<string, string>,
  );
}

export function formatCurrencyTotals(
  totals: Record<string, string>,
): Array<{ amount: string; currency: string }> {
  return Object.entries(totals)
    .map(([currency, amount]) => ({ amount, currency }))
    .filter(({ amount }) => {
      try {
        return utils.parseUnits(amount, 18).gt(0);
      } catch {
        return false;
      }
    });
}
