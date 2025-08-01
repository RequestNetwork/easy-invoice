"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Loader2, Plus, Send, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateRecurringPaymentForm } from "./blocks/create-recurring-payment-form";

type RecurringPaymentStep = "connect-wallet" | "create-payment";

export function CreateRecurringPayment() {
  const [currentStep, setCurrentStep] =
    useState<RecurringPaymentStep>("connect-wallet");
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppKitReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnected) {
      setCurrentStep("create-payment");
    } else {
      setCurrentStep("connect-wallet");
    }
  }, [isConnected]);

  return (
    <div className="flex justify-center mx-auto w-full max-w-6xl">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Recurring Payout
          </CardTitle>
        </CardHeader>

        {!isAppKitReady ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
              <p className="text-zinc-500">Initializing payment system...</p>
            </div>
          </CardContent>
        ) : (
          <>
            <CardContent className="pt-6 pb-2 space-y-6">
              {/* Payment steps indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center ${
                      currentStep === "connect-wallet" ||
                      currentStep === "create-payment"
                        ? "text-black"
                        : "text-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep === "connect-wallet" ||
                        currentStep === "create-payment"
                          ? "border-black bg-zinc-50"
                          : "border-zinc-300"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="ml-2 font-medium">Connect Wallet</span>
                  </div>

                  <div
                    className={`w-16 h-0.5 ${
                      currentStep === "create-payment"
                        ? "bg-black"
                        : "bg-zinc-300"
                    }`}
                  />

                  <div
                    className={`flex items-center ${
                      currentStep === "create-payment"
                        ? "text-black"
                        : "text-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep === "create-payment"
                          ? "border-black bg-zinc-50"
                          : "border-zinc-300"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="ml-2 font-medium">Create Payout</span>
                  </div>
                </div>
              </div>

              {currentStep === "connect-wallet" ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <p className="text-zinc-600 text-center max-w-md">
                    Connect your wallet to create recurring payouts
                  </p>
                  <Button onClick={() => open()} size="lg" className="mt-2">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <CreateRecurringPaymentForm />
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
