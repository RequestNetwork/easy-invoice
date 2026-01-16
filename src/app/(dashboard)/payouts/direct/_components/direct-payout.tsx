"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Loader2,
  LogOut,
  Send,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  PayoutConfirmationDialog,
  type PayoutConfirmationDialogRef,
} from "@/components/payout-confirmation-dialog";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PAYOUT_CURRENCIES,
  type PayoutCurrency,
  formatCurrencyLabel,
  getPaymentCurrenciesForPayout,
} from "@/lib/constants/currencies";

import { PaymentSecuredUsingRequest } from "@/components/payment-secured-using-request";
import { useSwitchNetwork } from "@/lib/hooks/use-switch-network";
import { paymentApiSchema } from "@/lib/schemas/payment";
import { api } from "@/trpc/react";
import type { z } from "zod";

export const directPaymentFormSchema = paymentApiSchema.omit({
  recurrence: true,
});

export type DirectPaymentFormValues = z.infer<typeof directPaymentFormSchema>;

export function DirectPayment() {
  const { mutateAsync: pay } = api.payment.pay.useMutation();
  const { switchToPaymentNetwork } = useSwitchNetwork();

  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "confirming" | "success" | "error"
  >("idle");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  const dialogRef = useRef<PayoutConfirmationDialogRef>(null);

  const form = useForm<DirectPaymentFormValues>({
    resolver: zodResolver(directPaymentFormSchema),
    defaultValues: {
      payee: "",
      amount: 0,
      invoiceCurrency: "USD",
      paymentCurrency: "ETH-sepolia-sepolia",
    },
  });

  const invoiceCurrency = form.watch("invoiceCurrency") as PayoutCurrency;
  const paymentCurrency = form.watch("paymentCurrency");

  const showPaymentCurrencySelect = invoiceCurrency === "USD";

  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppKitReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnected) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [isConnected]);

  const handleInvoiceCurrencyChange = (value: string) => {
    const newInvoiceCurrency = value as PayoutCurrency;
    form.setValue("invoiceCurrency", newInvoiceCurrency);

    if (newInvoiceCurrency !== "USD") {
      form.setValue("paymentCurrency", newInvoiceCurrency);
    } else {
      const validPaymentCurrencies =
        getPaymentCurrenciesForPayout(newInvoiceCurrency);
      form.setValue("paymentCurrency", validPaymentCurrencies[0]);
    }
  };

  const handleConfirmPayment = async (
    data: DirectPaymentFormValues,
    paymentData: Awaited<ReturnType<typeof pay>>,
  ) => {
    try {
      await switchToPaymentNetwork(data.paymentCurrency);
    } catch (networkError) {
      console.error("Network switch error:", networkError);
      toast.error("Failed to switch network", {
        description: "Please switch to the correct network and try again.",
      });
      setPaymentStatus("idle");
      return;
    }

    if (!walletProvider) {
      toast.error("Wallet disconnected", {
        description: "Please reconnect your wallet and try again.",
      });
      setPaymentStatus("idle");
      return;
    }

    try {
      setPaymentStatus("processing");

      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );

      const signer = ethersProvider.getSigner();

      toast.info("Sending payment", {
        description: "Please confirm the transaction in your wallet",
      });

      const isApprovalNeeded = paymentData.metadata?.needsApproval;

      if (isApprovalNeeded) {
        toast.info("Approval required", {
          description: "Please approve the transaction in your wallet",
        });

        const approvalTransaction = await signer.sendTransaction(
          paymentData.transactions[
            paymentData.metadata.approvalTransactionIndex
          ],
        );

        await approvalTransaction.wait();
      }

      const paymentTransactionIndex =
        paymentData.metadata?.paymentTransactionIndex ?? 0;

      const paymentTransaction = await signer.sendTransaction(
        paymentData.transactions[paymentTransactionIndex],
      );

      await paymentTransaction.wait();

      toast.success("Payment successful", {
        description: `You've paid ${data.amount} ${formatCurrencyLabel(
          data.invoiceCurrency,
        )} to ${data.payee.substring(0, 6)}...${data.payee.substring(
          data.payee.length - 4,
        )}`,
      });

      setPaymentStatus("success");

      setTimeout(() => {
        form.reset({
          payee: "",
          amount: 0,
          invoiceCurrency: "USD",
          paymentCurrency: "ETH-sepolia-sepolia",
        });
        setPaymentStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed", {
        description:
          "There was an error processing your payment. Please try again.",
      });
      setPaymentStatus("error");
    }
  };

  const onSubmit = async (data: DirectPaymentFormValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setPaymentStatus("processing");

      toast.info("Preparing payment...");

      const paymentData = await pay({
        payerWallet: address,
        ...data,
      });

      dialogRef.current?.show({
        mode: "direct",
        amount: data.amount,
        currency: data.invoiceCurrency,
        platformFee: paymentData.metadata?.platformFee,
        protocolFee: paymentData.metadata?.protocolFee,
        walletAddress: address,
      });

      dialogRef.current?.onConfirm(() => {
        handleConfirmPayment(data, paymentData);
      });

      dialogRef.current?.onCancel(() => {
        setPaymentStatus("idle");
      });

      setPaymentStatus("confirming");
    } catch (error) {
      console.error("Failed to prepare payment:", error);
      toast.error("Failed to prepare payment", {
        description: "Please try again.",
      });
      setPaymentStatus("error");
    }
  };

  return (
    <div className="flex justify-center mx-auto w-full">
      <Card className="w-full shadow-lg border border-border bg-card text-card-foreground">
        <CardHeader className="bg-muted rounded-t-lg border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Direct Payout
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
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center ${
                      currentStep >= 1
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep >= 1
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
                      currentStep >= 2 ? "bg-foreground" : "bg-border"
                    }`}
                  />

                  <div
                    className={`flex items-center ${
                      currentStep >= 2
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep >= 2
                          ? "border-foreground bg-muted"
                          : "border-border"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="ml-2 font-medium">Send Payment</span>
                  </div>
                </div>
              </div>

              {currentStep === 1 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <p className="text-muted-foreground text-center max-w-md">
                    Connect your wallet to send direct payments to any address
                  </p>
                  <Button onClick={() => open()} size="lg" className="mt-2">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div
                      className={`grid ${
                        showPaymentCurrencySelect
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      } gap-4`}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="invoiceCurrency">
                          Invoice Currency
                        </Label>
                        <Select
                          value={invoiceCurrency}
                          onValueChange={handleInvoiceCurrencyChange}
                          disabled={
                            paymentStatus === "processing" ||
                            paymentStatus === "confirming"
                          }
                        >
                          <SelectTrigger id="invoiceCurrency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYOUT_CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {formatCurrencyLabel(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.invoiceCurrency && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.invoiceCurrency.message}
                          </p>
                        )}
                      </div>

                      {showPaymentCurrencySelect && (
                        <div className="space-y-2">
                          <Label htmlFor="paymentCurrency">
                            Payment Currency
                          </Label>
                          <Select
                            value={paymentCurrency}
                            onValueChange={(value) =>
                              form.setValue(
                                "paymentCurrency",
                                value as PayoutCurrency,
                              )
                            }
                            disabled={
                              paymentStatus === "processing" ||
                              paymentStatus === "confirming"
                            }
                          >
                            <SelectTrigger id="paymentCurrency">
                              <SelectValue placeholder="Select payment currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {getPaymentCurrenciesForPayout(
                                invoiceCurrency,
                              ).map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {formatCurrencyLabel(currency)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.paymentCurrency && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.paymentCurrency.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        step="any"
                        min="0"
                        {...form.register("amount", {
                          valueAsNumber: true,
                        })}
                        className="pr-12"
                        disabled={
                          paymentStatus === "processing" ||
                          paymentStatus === "confirming"
                        }
                      />
                      {form.formState.errors.amount && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.amount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payee">Recipient Address</Label>
                      <Input
                        id="payee"
                        placeholder="0x..."
                        {...form.register("payee")}
                        disabled={
                          paymentStatus === "processing" ||
                          paymentStatus === "confirming"
                        }
                        className="font-mono"
                      />
                      {form.formState.errors.payee && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.payee.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <PaymentSecuredUsingRequest />
                  <CardFooter className="flex justify-between items-center pt-2 pb-0 px-0">
                    <button
                      type="button"
                      onClick={() => open()}
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="font-mono mr-2">
                        {address?.substring(0, 6)}...
                        {address?.substring(address?.length - 4)}
                      </span>
                      <LogOut className="h-3 w-3" />
                    </button>
                    <Button
                      type="submit"
                      className="relative"
                      disabled={
                        paymentStatus === "processing" ||
                        paymentStatus === "confirming"
                      }
                    >
                      {paymentStatus === "processing" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Preparing...
                        </>
                      ) : paymentStatus === "confirming" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Awaiting Confirmation...
                        </>
                      ) : paymentStatus === "success" ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Payment Sent
                        </>
                      ) : paymentStatus === "error" ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Try Again
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Send Payment
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </CardContent>

            {currentStep === 2 && !form.formState.isSubmitSuccessful && (
              <CardFooter className="pt-2 pb-6" />
            )}
          </>
        )}
      </Card>

      <PayoutConfirmationDialog ref={dialogRef} />
    </div>
  );
}
