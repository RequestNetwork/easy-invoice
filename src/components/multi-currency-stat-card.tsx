import { Card } from "@/components/ui/card";

interface MultiCurrencyStatCardProps {
  title: string;
  icon: React.ReactNode;
  values: Array<{
    amount: string;
    currency: string;
  }>;
}

export function MultiCurrencyStatCard({
  title,
  icon,
  values,
}: MultiCurrencyStatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-sm font-medium text-zinc-600">{title}</h3>
      </div>
      <div className="space-y-1">
        {values.length === 0 ? (
          <p className="text-2xl font-bold text-zinc-900">--</p>
        ) : (
          values.map(({ amount, currency }) => (
            <div key={currency} className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">{amount}</span>
              <span className="text-sm font-medium text-zinc-500 uppercase">
                {currency}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
