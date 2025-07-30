import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type InvoiceCurrency,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import type { GetConversionCurrenciesResponse } from "@/server/routers/currency";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

interface PaymentCurrencySelectorProps {
  onChange: (value: string) => void;
  targetCurrency: InvoiceCurrency;
  network: string;
}

export function PaymentCurrencySelector({
  onChange,
  targetCurrency,
  network,
}: PaymentCurrencySelectorProps) {
  const {
    data: conversionData,
    isLoading,
    error,
  } = api.currency.getConversionCurrencies.useQuery<GetConversionCurrenciesResponse>(
    {
      targetCurrency,
      network,
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="paymentCurrency">Payment Currency</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading currencies...</span>
              </div>
            </SelectValue>
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor="paymentCurrency">Payment Currency</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Error loading currencies" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-red-500">
          Failed to load payment currencies: {error.message}
        </p>
      </div>
    );
  }

  const conversionRoutes = conversionData?.conversionRoutes || [];

  return (
    <div className="space-y-2">
      <Label htmlFor="paymentCurrency">Payment Currency</Label>
      <Select onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select payment currency" />
        </SelectTrigger>
        <SelectContent>
          {conversionRoutes.map((currency) => (
            <SelectItem key={currency.id} value={currency.id}>
              {formatCurrencyLabel(currency.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
