"use client";

import { ChainCurrencySelector } from "@/components/chain-currency-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHAIN_TO_ID } from "@/lib/constants/chains";
import { TRPCReactProvider } from "@/trpc/react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { LogOut, Wallet } from "lucide-react";
import { useState } from "react";

function PaymentDestinationContent() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [chainId, setChainId] = useState<number>(CHAIN_TO_ID.SEPOLIA);
  const [tokenAddress, setTokenAddress] = useState<string | undefined>(
    undefined,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.info({
      walletAddress: address,
      chainId,
      tokenAddress,
    });
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Payment Destination</h1>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Connected Address</div>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {address}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => open()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Manage Wallet
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Please connect your wallet to continue
                </p>
                <Button onClick={() => open()} size="lg">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chain and Currency Selection */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <ChainCurrencySelector
                  chainId={chainId}
                  tokenAddress={tokenAddress}
                  onChainChange={(newChainId) => {
                    setChainId(newChainId);
                    setTokenAddress(undefined);
                  }}
                  onTokenChange={setTokenAddress}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!tokenAddress}
                >
                  Submit
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PaymentDestinationPage() {
  return (
    <TRPCReactProvider cookies="">
      <PaymentDestinationContent />
    </TRPCReactProvider>
  );
}
