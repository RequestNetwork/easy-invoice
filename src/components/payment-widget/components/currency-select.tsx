"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import {
  getConversionCurrencies,
  getSymbolOverride,
  type ConversionCurrency,
} from "../utils/currencies";
import { Check } from "lucide-react";
import { usePaymentWidgetContext } from "../context/payment-widget-context/use-payment-widget-context";

interface CurrencySelectProps {
  onSubmit: (currency: ConversionCurrency) => void;
}

export function CurrencySelect({ onSubmit }: CurrencySelectProps) {
  const {
    paymentConfig: { rnApiClientId, supportedCurrencies },
  } = usePaymentWidgetContext();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  const {
    data: conversionCurrencies,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["conversionCurrencies", rnApiClientId],
    queryFn: () => getConversionCurrencies(rnApiClientId),
  });

  const handleSubmit = () => {
    const currency = conversionCurrencies?.find(
      (c) => c.id === selectedCurrency,
    );
    if (currency) {
      onSubmit(currency);
    }
  };

  if (isLoading) {
    return <div>Loading currencies...</div>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-red-500">
          Error loading currencies. Please try again later.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!conversionCurrencies || conversionCurrencies.length === 0) {
    return <div>No conversion currencies available.</div>;
  }

  const lowerCaseSupportedCurrencies = supportedCurrencies.map((currency) =>
    currency.toLowerCase(),
  );

  const eligibleCurrencies =
    lowerCaseSupportedCurrencies.length > 0
      ? conversionCurrencies.filter((currency) =>
          lowerCaseSupportedCurrencies.includes(currency.id.toLowerCase()),
        )
      : conversionCurrencies;

  if (eligibleCurrencies.length === 0) {
    console.warn(
      "Your supportedCurrencies do not match available currencies.",
      { supportedCurrencies, conversionCurrencies },
    );
    return <div>No supported currencies available.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select a currency</h3>
      <RadioGroup value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <div className="space-y-2 overflow-y-auto max-h-60">
          {eligibleCurrencies.map((currency) => {
            const isSelected = selectedCurrency === currency.id;
            return (
              <div key={currency.id}>
                <label
                  htmlFor={currency.id}
                  className={`flex items-center justify-between cursor-pointer w-full p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? "bg-accent border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem
                      value={currency.id}
                      id={currency.id}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getSymbolOverride(currency.symbol)}
                    </div>
                    <div className="font-bold text-foreground">
                      {currency.name}
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
      <Button
        onClick={handleSubmit}
        disabled={!selectedCurrency}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
