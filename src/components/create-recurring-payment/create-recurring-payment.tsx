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
      <Card className="w-full shadow-lg border border-border bg-card text-card-foreground">
        <CardHeader className="bg-muted rounded-t-lg border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Recurring Payout
          </CardTitle>
        </CardHeader>

        {!isAppKitReady ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">
                Initializing payment system...
              </p>
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
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep === "connect-wallet" ||
                        currentStep === "create-payment"
                          ? "border-foreground bg-muted"
                          : "border-border"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="ml-2 font-medium">Connect Wallet</span>
                  </div>

                  <div
                    className={`w-16 h-0.5 ${
                      currentStep === "create-payment"
                        ? "bg-foreground"
                        : "bg-border"
                    }`}
                  />

                  <div
                    className={`flex items-center ${
                      currentStep === "create-payment"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep === "create-payment"
                          ? "border-foreground bg-muted"
                          : "border-border"
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
                  <p className="text-muted-foreground text-center max-w-md">
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
