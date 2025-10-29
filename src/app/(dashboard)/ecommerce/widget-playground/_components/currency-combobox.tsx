"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  INVOICE_CURRENCIES,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CurrencyComboboxProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
}

export function CurrencyCombobox({
  value = [],
  onChange,
  className,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(value);

  useEffect(() => {
    setSelectedCurrencies(value);
  }, [value]);

  const handleSelect = (currency: string) => {
    const updatedSelection = selectedCurrencies.includes(currency)
      ? selectedCurrencies.filter((item) => item !== currency)
      : [...selectedCurrencies, currency];

    setSelectedCurrencies(updatedSelection);
    onChange?.(updatedSelection);
  };

  const handleRemove = (currency: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSelection = selectedCurrencies.filter(
      (item) => item !== currency,
    );
    setSelectedCurrencies(updatedSelection);
    onChange?.(updatedSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          // biome-ignore lint/a11y/useSemanticElements: It suggests select, but that's not suitable here
          role="combobox"
          aria-expanded={open}
          aria-controls="currency-combobox-list"
          className={cn("w-full justify-between", className)}
        >
          {selectedCurrencies.length === 0 ? (
            <span className="text-muted-foreground">Select currencies...</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedCurrencies.map((currency) => (
                <Badge key={currency} variant="secondary" className="mr-1">
                  {formatCurrencyLabel(currency)}
                  <span
                    aria-label={`Remove ${formatCurrencyLabel(currency)}`}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => handleRemove(currency, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        id="currency-combobox-list"
      >
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {INVOICE_CURRENCIES.map((currency) => (
                <CommandItem
                  key={currency}
                  value={currency}
                  onSelect={() => handleSelect(currency)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCurrencies.includes(currency)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {formatCurrencyLabel(currency)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
