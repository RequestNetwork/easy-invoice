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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  INVOICE_CURRENCIES,
  type InvoiceCurrency,
  type PaymentCurrency,
  formatCurrencyLabel,
  getPaymentCurrenciesForInvoice,
} from "@/lib/currencies";
import {
  type PaymentFormValues,
  paymentFormSchema,
} from "@/lib/schemas/payment";
import { api } from "@/trpc/react";

export function DirectPayment() {
  const { mutateAsync: pay } = api.payment.pay.useMutation();

  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payee: "",
      amount: 0,
      invoiceCurrency: "USD",
      paymentCurrency: "ETH-sepolia-sepolia",
    },
  });

  const invoiceCurrency = form.watch("invoiceCurrency") as InvoiceCurrency;
  const paymentCurrency = form.watch("paymentCurrency") as PaymentCurrency;

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
    const newInvoiceCurrency = value as InvoiceCurrency;
    form.setValue("invoiceCurrency", newInvoiceCurrency);

    if (newInvoiceCurrency !== "USD") {
      form.setValue("paymentCurrency", newInvoiceCurrency);
    } else {
      const validPaymentCurrencies =
        getPaymentCurrenciesForInvoice(newInvoiceCurrency);
      form.setValue("paymentCurrency", validPaymentCurrencies[0]);
    }
  };

  const onSubmit = async (data: PaymentFormValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setPaymentStatus("processing");

    try {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );

      const signer = await ethersProvider.getSigner();

      toast.info("Initiating payment...");

      const paymentData = await pay(data);

      const isApprovalNeeded = paymentData.metadata?.needsApproval;

      if (isApprovalNeeded) {
        toast.info("Approval required", {
          description: "Please approve the transaction in your wallet",
        });

        const approvalIndex = paymentData.metadata.approvalTransactionIndex;

        const approvalTransaction = await signer.sendTransaction(
          paymentData.transactions[approvalIndex],
        );

        await approvalTransaction.wait();
      }

      toast.info("Sending payment", {
        description: "Please confirm the transaction in your wallet",
      });

      const paymentTransaction = await signer.sendTransaction(
        paymentData.transactions[isApprovalNeeded ? 1 : 0],
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

      // Reset form after successful payment
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

  return (
    <div className="flex justify-center mx-auto w-full max-w-2xl">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Direct Payment
          </CardTitle>
          <CardDescription>
            Send payments instantly without creating a request first
          </CardDescription>
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
                      currentStep >= 1 ? "text-black" : "text-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep >= 1
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
                      currentStep >= 2 ? "bg-black" : "bg-zinc-300"
                    }`}
                  />

                  <div
                    className={`flex items-center ${
                      currentStep >= 2 ? "text-black" : "text-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        currentStep >= 2
                          ? "border-black bg-zinc-50"
                          : "border-zinc-300"
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
                  <p className="text-zinc-600 text-center max-w-md">
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
                  {/* Payment form */}
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
                          disabled={paymentStatus === "processing"}
                        >
                          <SelectTrigger id="invoiceCurrency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {INVOICE_CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {formatCurrencyLabel(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.invoiceCurrency && (
                          <p className="text-sm text-red-500">
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
                                value as PaymentCurrency,
                              )
                            }
                            disabled={paymentStatus === "processing"}
                          >
                            <SelectTrigger id="paymentCurrency">
                              <SelectValue placeholder="Select payment currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {getPaymentCurrenciesForInvoice(
                                invoiceCurrency,
                              ).map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {formatCurrencyLabel(currency)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.paymentCurrency && (
                            <p className="text-sm text-red-500">
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
                        {...form.register("amount", {
                          valueAsNumber: true,
                        })}
                        className="pr-12"
                        disabled={paymentStatus === "processing"}
                      />
                      {form.formState.errors.amount && (
                        <p className="text-sm text-red-500">
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
                        disabled={paymentStatus === "processing"}
                        className="font-mono"
                      />
                      {form.formState.errors.payee && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.payee.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Security notice */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                    <h3 className="font-semibold text-green-800 mb-1 text-sm">
                      Secure Transaction
                    </h3>
                    <p className="text-xs text-green-700">
                      This payment is secured using Request Network. Your
                      transaction will be processed safely and transparently on
                      the blockchain.
                    </p>
                  </div>

                  <CardFooter className="flex justify-between items-center pt-2 pb-0 px-0">
                    <button
                      type="button"
                      onClick={() => open()}
                      className="flex items-center text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
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
                      disabled={paymentStatus === "processing"}
                    >
                      {paymentStatus === "processing" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
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
              <CardFooter className="pt-2 pb-6">
                {/* Empty footer for spacing when form is displayed */}
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
