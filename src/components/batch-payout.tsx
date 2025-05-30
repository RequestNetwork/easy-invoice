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
  Copy,
  CreditCard,
  Loader2,
  LogOut,
  Plus,
  Send,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
} from "@/lib/constants/currencies";
import {
  type BatchPaymentFormValues,
  batchPaymentFormSchema,
} from "@/lib/schemas/payment";
import { api } from "@/trpc/react";

export function BatchPayout() {
  const { mutateAsync: batchPay } = api.payment.batchPay.useMutation();

  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  const form = useForm<BatchPaymentFormValues>({
    resolver: zodResolver(batchPaymentFormSchema),
    defaultValues: {
      payments: [
        {
          payee: "",
          amount: 0,
          invoiceCurrency: "USD",
          paymentCurrency: "ETH-sepolia-sepolia",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

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

  const handleInvoiceCurrencyChange = (value: string, index: number) => {
    const newInvoiceCurrency = value as InvoiceCurrency;
    form.setValue(`payments.${index}.invoiceCurrency`, newInvoiceCurrency);

    if (newInvoiceCurrency !== "USD") {
      form.setValue(`payments.${index}.paymentCurrency`, newInvoiceCurrency);
    } else {
      const validPaymentCurrencies =
        getPaymentCurrenciesForInvoice(newInvoiceCurrency);
      form.setValue(
        `payments.${index}.paymentCurrency`,
        validPaymentCurrencies[0],
      );
    }
  };

  const addPayment = () => {
    append({
      payee: "",
      amount: 0,
      invoiceCurrency: "USD",
      paymentCurrency: "ETH-sepolia-sepolia",
    });
  };

  const removePayment = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const duplicatePayment = (index: number) => {
    const payment = form.getValues(`payments.${index}`);
    append({ ...payment, payee: "" });
  };

  const getValidPaymentsCount = () => {
    const payments = form.getValues("payments");
    return payments.filter((payment) => payment.payee && payment.amount > 0)
      .length;
  };

  const onSubmit = async (data: BatchPaymentFormValues) => {
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

      toast.info("Initiating batch payment...");

      const batchPaymentData = await batchPay({
        ...data,
        payer: address,
      });

      toast.info("Initiating payment...");

      const isApprovalNeeded =
        batchPaymentData.ERC20ApprovalTransactions.length > 0;

      if (isApprovalNeeded) {
        toast.info("Approval required", {
          description: "Please approve the transaction in your wallet",
        });

        for (const approvalTransaction of batchPaymentData.ERC20ApprovalTransactions) {
          const tx = await signer.sendTransaction(approvalTransaction as any);
          await tx.wait();
        }
      }

      if (batchPaymentData.ERC20BatchPaymentTransaction) {
        toast.info("Sending ERC20 batch payment...");
        const tx = await signer.sendTransaction(
          batchPaymentData.ERC20BatchPaymentTransaction as any,
        );
        await tx.wait();
      }

      if (batchPaymentData.ETHBatchPaymentTransaction) {
        toast.info("Sending ETH batch payment...");
        const tx = await signer.sendTransaction(
          batchPaymentData.ETHBatchPaymentTransaction as any,
        );
        await tx.wait();
      }

      toast.success("Batch payment successful", {
        description: `Successfully processed ${data.payments.length} payments`,
      });

      setPaymentStatus("success");

      // Reset form after successful payment
      setTimeout(() => {
        form.reset({
          payments: [
            {
              payee: "",
              amount: 0,
              invoiceCurrency: "USD",
              paymentCurrency: "ETH-sepolia-sepolia",
            },
          ],
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
    <div className="flex justify-center mx-auto w-full max-w-4xl">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Batch Payout
              </CardTitle>
              <CardDescription>
                Create and send multiple payments efficiently in a single batch
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {getValidPaymentsCount()} of {fields.length} ready
            </Badge>
          </div>
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
                    className={`flex items-center ${currentStep >= 1 ? "text-black" : "text-zinc-300"}`}
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
                    className={`w-16 h-0.5 ${currentStep >= 2 ? "bg-black" : "bg-zinc-300"}`}
                  />

                  <div
                    className={`flex items-center ${currentStep >= 2 ? "text-black" : "text-zinc-300"}`}
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
                    <span className="ml-2 font-medium">Send Payments</span>
                  </div>
                </div>
              </div>

              {currentStep === 1 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <p className="text-zinc-600 text-center max-w-md">
                    Connect your wallet to send batch payments to multiple
                    addresses
                  </p>
                  <Button onClick={() => open()} size="lg" className="mt-2">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Payment forms */}
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const invoiceCurrency = form.watch(
                        `payments.${index}.invoiceCurrency`,
                      ) as InvoiceCurrency;
                      const showPaymentCurrencySelect =
                        invoiceCurrency === "USD";

                      return (
                        <Card key={field.id} className="border-zinc-200">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Payment #{index + 1}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => duplicatePayment(index)}
                                  className="text-zinc-500 hover:text-zinc-700"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePayment(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div
                              className={`grid ${showPaymentCurrencySelect ? "grid-cols-2" : "grid-cols-1"} gap-4`}
                            >
                              <div className="space-y-2">
                                <Label htmlFor={`invoiceCurrency-${index}`}>
                                  Invoice Currency
                                </Label>
                                <Select
                                  value={invoiceCurrency}
                                  onValueChange={(value) =>
                                    handleInvoiceCurrencyChange(value, index)
                                  }
                                  disabled={paymentStatus === "processing"}
                                >
                                  <SelectTrigger
                                    id={`invoiceCurrency-${index}`}
                                  >
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INVOICE_CURRENCIES.map((currency) => (
                                      <SelectItem
                                        key={currency}
                                        value={currency}
                                      >
                                        {formatCurrencyLabel(currency)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {showPaymentCurrencySelect && (
                                <div className="space-y-2">
                                  <Label htmlFor={`paymentCurrency-${index}`}>
                                    Payment Currency
                                  </Label>
                                  <Select
                                    value={form.watch(
                                      `payments.${index}.paymentCurrency`,
                                    )}
                                    onValueChange={(value) =>
                                      form.setValue(
                                        `payments.${index}.paymentCurrency`,
                                        value as PaymentCurrency,
                                      )
                                    }
                                    disabled={paymentStatus === "processing"}
                                  >
                                    <SelectTrigger
                                      id={`paymentCurrency-${index}`}
                                    >
                                      <SelectValue placeholder="Select payment currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getPaymentCurrenciesForInvoice(
                                        invoiceCurrency,
                                      ).map((currency) => (
                                        <SelectItem
                                          key={currency}
                                          value={currency}
                                        >
                                          {formatCurrencyLabel(currency)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`amount-${index}`}>
                                  Amount
                                </Label>
                                <Input
                                  id={`amount-${index}`}
                                  type="number"
                                  placeholder="0.00"
                                  {...form.register(
                                    `payments.${index}.amount`,
                                    {
                                      valueAsNumber: true,
                                    },
                                  )}
                                  disabled={paymentStatus === "processing"}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`payee-${index}`}>
                                  Recipient Address
                                </Label>
                                <Input
                                  id={`payee-${index}`}
                                  placeholder="0x..."
                                  {...form.register(`payments.${index}.payee`)}
                                  disabled={paymentStatus === "processing"}
                                  className="font-mono"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Add payment button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPayment}
                    className="w-full border-dashed border-2 border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-700"
                    disabled={paymentStatus === "processing"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Payment
                  </Button>

                  {/* Batch summary */}
                  {fields.length > 1 && (
                    <Card className="bg-zinc-50 border-zinc-200">
                      <CardContent className="p-4">
                        <h3 className="font-medium text-zinc-900 mb-3">
                          Batch Summary
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-600">
                              Total Payments:
                            </span>
                            <span className="font-medium">{fields.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">
                              Ready to Process:
                            </span>
                            <span className="font-medium">
                              {getValidPaymentsCount()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Security notice */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-1 text-sm">
                      Secure Batch Transaction
                    </h3>
                    <p className="text-xs text-green-700">
                      This batch payment is secured using Request Network. All
                      transactions will be processed safely and transparently on
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
                      disabled={
                        paymentStatus === "processing" ||
                        getValidPaymentsCount() === 0
                      }
                    >
                      {paymentStatus === "processing" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Batch...
                        </>
                      ) : paymentStatus === "success" ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Batch Sent
                        </>
                      ) : paymentStatus === "error" ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Try Again
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Send Batch Payment ({getValidPaymentsCount()})
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
