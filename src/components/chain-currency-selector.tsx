"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAIN_TO_ID, ID_TO_NETWORK } from "@/lib/constants/chains";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ChainCurrencySelectorProps {
  chainId: number;
  tokenAddress: string | undefined;
  onChainChange: (chainId: number) => void;
  onTokenChange: (address: string | undefined) => void;
  isLoading?: boolean;
}

export function ChainCurrencySelector({
  chainId,
  tokenAddress,
  onChainChange,
  onTokenChange,
}: ChainCurrencySelectorProps) {
  const networkName = ID_TO_NETWORK[chainId];

  const {
    data: currenciesData,
    isLoading,
    isError,
    refetch,
  } = api.currency.getCurrenciesByNetwork.useQuery(
    { network: networkName },
    {
      enabled: !!networkName,
      staleTime: 86400000, // 1 day
      gcTime: 86400000, // 1 day
    },
  );

  const currencies = currenciesData?.conversionRoutes || [];

  // Auto-select first token when currencies load or chain changes
  useEffect(() => {
    if (
      currencies.length > 0 &&
      !currencies.find((c) => c.address === tokenAddress)
    ) {
      onTokenChange(currencies[0].address);
    }
  }, [currencies, tokenAddress, onTokenChange]);

  const chainOptions = [
    { id: CHAIN_TO_ID.SEPOLIA, name: "Sepolia" },
    { id: CHAIN_TO_ID.BASE, name: "Base" },
    { id: CHAIN_TO_ID.ETHEREUM, name: "Ethereum" },
    { id: CHAIN_TO_ID.ARBITRUM, name: "Arbitrum" },
    { id: CHAIN_TO_ID.OPTIMISM, name: "Optimism" },
    { id: CHAIN_TO_ID.POLYGON, name: "Polygon" },
  ];

  return (
    <div className="space-y-4">
      {/* Chain Selector */}
      <div className="space-y-2">
        <label htmlFor="chain-select" className="text-sm font-medium">
          Chain
        </label>
        <Select
          value={chainId.toString()}
          onValueChange={(value) => onChainChange(Number(value))}
        >
          <SelectTrigger id="chain-select">
            <SelectValue placeholder="Select a chain" />
          </SelectTrigger>
          <SelectContent>
            {chainOptions.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Token Selector */}
      <div className="space-y-2">
        <label htmlFor="token-select" className="text-sm font-medium">
          Token
        </label>
        {isLoading ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-background">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading tokens...
            </span>
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 h-10 px-3 border border-destructive rounded-md bg-background">
              <span className="text-sm text-destructive">
                Something went wrong
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : currencies.length === 0 ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-background">
            <span className="text-sm text-muted-foreground">
              No tokens available
            </span>
          </div>
        ) : (
          <Select value={tokenAddress} onValueChange={onTokenChange}>
            <SelectTrigger id="token-select">
              <SelectValue placeholder="Select a token" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.address}>
                  {currency.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export function isChainCurrencySelectorLoading(chainId: number): boolean {
  const networkName = ID_TO_NETWORK[chainId];
  const { isLoading } = api.currency.getCurrenciesByNetwork.useQuery(
    { network: networkName },
    {
      enabled: !!networkName,
      staleTime: 86400000,
      gcTime: 86400000,
    },
  );
  return isLoading;
}
