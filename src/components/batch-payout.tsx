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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  PAYOUT_CURRENCIES,
  type PayoutCurrency,
  formatCurrencyLabel,
  getPaymentCurrenciesForPayout,
} from "@/lib/constants/currencies";
import { handleBatchPayment } from "@/lib/invoice/batch-payment";
import { payoutSchema } from "@/lib/schemas/payment";
import { api } from "@/trpc/react";
import { z } from "zod";
import { PaymentSecuredUsingRequest } from "./payment-secured-using-request";

const MAX_PAYMENTS = 10;

const batchPaymentFormSchema = z.object({
  payouts: z
    .array(payoutSchema)
    .min(1, "At least one payment is required")
    .max(10, "Maximum 10 payments allowed"),
});

export type BatchPaymentFormValues = z.infer<typeof batchPaymentFormSchema>;

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
      payouts: [
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
    name: "payouts",
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
    const newInvoiceCurrency = value as PayoutCurrency;
    form.setValue(`payouts.${index}.invoiceCurrency`, newInvoiceCurrency);

    const validPaymentCurrencies =
      getPaymentCurrenciesForPayout(newInvoiceCurrency);

    if (validPaymentCurrencies.length > 0) {
      form.setValue(
        `payouts.${index}.paymentCurrency`,
        validPaymentCurrencies[0],
      );
    }
  };

  const addPayment = () => {
    if (fields.length < MAX_PAYMENTS) {
      append({
        payee: "",
        amount: 0,
        invoiceCurrency: "USD",
        paymentCurrency: "ETH-sepolia-sepolia",
      });
    }
  };

  const removePayment = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const duplicatePayment = (index: number) => {
    if (fields.length < MAX_PAYMENTS) {
      const payout = form.getValues(`payouts.${index}`);
      append({ ...payout });
    }
  };

  const getValidPaymentsCount = () => {
    const payouts = form.watch("payouts");
    return payouts.filter((payout) => payout.payee && payout.amount > 0).length;
  };

  const getUniqueAddressesCount = () => {
    const payouts = form.watch("payouts");
    const uniqueAddresses = new Set(
      payouts
        .filter((payout) => payout.payee)
        .map((payout) => payout.payee.toLowerCase()),
    );
    return uniqueAddresses.size;
  };

  const getTotalsByCurrency = () => {
    const payouts = form.watch("payouts");
    const totals: Record<string, ethers.BigNumber> = {};

    for (const payout of payouts) {
      if (payout.amount > 0) {
        const currency = payout.invoiceCurrency;

        const amount = ethers.utils.parseUnits(payout.amount.toString(), 18);
        totals[currency] = (totals[currency] || ethers.BigNumber.from(0)).add(
          amount,
        );
      }
    }

    const humanReadableTotals: Record<string, string> = {};
    for (const [currency, bigNumberTotal] of Object.entries(totals)) {
      humanReadableTotals[currency] = ethers.utils.formatUnits(
        bigNumberTotal,
        18,
      );
    }

    return humanReadableTotals;
  };

  const onSubmit = async (data: BatchPaymentFormValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider);

      const signer = ethersProvider.getSigner();

      const batchPaymentData = await batchPay({
        ...data,
        payer: address,
      });

      const result = await handleBatchPayment({
        signer,
        batchPaymentData,
        onSuccess: () => {
          toast.success("Batch payment successful", {
            description: `Successfully processed ${data.payouts.length} payments`,
          });
          form.reset({
            payouts: [
              {
                payee: "",
                amount: 0,
                invoiceCurrency: "USD",
                paymentCurrency: "ETH-sepolia-sepolia",
              },
            ],
          });
          setPaymentStatus("idle");
        },
        onError: () => {
          setPaymentStatus("error");
        },
        onStatusChange: setPaymentStatus,
      });

      if (!result.success) {
        console.error("Batch payment failed:", result.error);
      }
    } catch (error) {
      console.error("Failed to initiate batch payment:", error);
      setPaymentStatus("error");
    }
  };

  const totalsByCurrency = getTotalsByCurrency();

  return (
    <div className="flex justify-center mx-auto w-full">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Batch Payout
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {getValidPaymentsCount()} of {fields.length} ready
              </Badge>
              <Badge variant="outline" className="text-sm">
                {fields.length}/{MAX_PAYMENTS} payments
              </Badge>
            </div>
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
                  {/* Excel-like table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead className="min-w-[300px]">
                            Recipient Address
                          </TableHead>
                          <TableHead className="w-32">Amount</TableHead>
                          <TableHead className="w-40">
                            Invoice Currency
                          </TableHead>
                          <TableHead className="w-40">
                            Payment Currency
                          </TableHead>
                          <TableHead className="w-20 text-center">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const invoiceCurrency = form.watch(
                            `payouts.${index}.invoiceCurrency`,
                          ) as PayoutCurrency;
                          const showPaymentCurrencySelect =
                            invoiceCurrency === "USD";

                          return (
                            <TableRow
                              key={field.id}
                              className="hover:bg-zinc-50/50"
                            >
                              <TableCell className="text-center text-sm text-zinc-500 font-medium">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="0x..."
                                  {...form.register(`payouts.${index}.payee`)}
                                  disabled={paymentStatus === "processing"}
                                  className="font-mono text-sm border-0 shadow-none focus-visible:ring-1 focus-visible:ring-zinc-300"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  step="any"
                                  min="0"
                                  {...form.register(`payouts.${index}.amount`, {
                                    valueAsNumber: true,
                                  })}
                                  disabled={paymentStatus === "processing"}
                                  className="text-sm border-0 shadow-none focus-visible:ring-1 focus-visible:ring-zinc-300"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={invoiceCurrency}
                                  onValueChange={(value) =>
                                    handleInvoiceCurrencyChange(value, index)
                                  }
                                  disabled={paymentStatus === "processing"}
                                >
                                  <SelectTrigger className="text-sm border-0 shadow-none focus:ring-1 focus:ring-zinc-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PAYOUT_CURRENCIES.map(
                                      (currency: PayoutCurrency) => (
                                        <SelectItem
                                          key={currency}
                                          value={currency}
                                        >
                                          {formatCurrencyLabel(currency)}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {showPaymentCurrencySelect ? (
                                  <Select
                                    value={form.watch(
                                      `payouts.${index}.paymentCurrency`,
                                    )}
                                    onValueChange={(value) =>
                                      form.setValue(
                                        `payouts.${index}.paymentCurrency`,
                                        value as PayoutCurrency,
                                      )
                                    }
                                    disabled={paymentStatus === "processing"}
                                  >
                                    <SelectTrigger className="text-sm border-0 shadow-none focus:ring-1 focus:ring-zinc-300">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getPaymentCurrenciesForPayout(
                                        invoiceCurrency,
                                      ).map((currency: string) => (
                                        <SelectItem
                                          key={currency}
                                          value={currency}
                                        >
                                          {formatCurrencyLabel(currency)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="text-sm text-zinc-500 px-3 py-2">
                                    {formatCurrencyLabel(invoiceCurrency)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => duplicatePayment(index)}
                                    disabled={fields.length >= MAX_PAYMENTS}
                                    className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-700"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  {fields.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePayment(index)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Add payment button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPayment}
                    disabled={
                      fields.length >= MAX_PAYMENTS ||
                      paymentStatus === "processing"
                    }
                    className="w-full border-dashed border-2 border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Row ({fields.length}/{MAX_PAYMENTS})
                  </Button>

                  {/* Enhanced Summary */}
                  <Card className="bg-zinc-50 border-zinc-200">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-zinc-900 mb-3">
                        Batch Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-600">Total Items:</span>
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
                          <div className="flex justify-between">
                            <span className="text-zinc-600">
                              Unique Addresses:
                            </span>
                            <span className="font-medium">
                              {getUniqueAddressesCount()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="font-medium text-zinc-900 mb-2">
                            Totals by Currency:
                          </div>
                          {Object.keys(totalsByCurrency).length > 0 ? (
                            Object.entries(totalsByCurrency).map(
                              ([currency, total]) => (
                                <div
                                  key={currency}
                                  className="flex justify-between"
                                >
                                  <span className="text-zinc-600">
                                    {formatCurrencyLabel(currency)}:
                                  </span>
                                  <span className="font-medium">{total}</span>
                                </div>
                              ),
                            )
                          ) : (
                            <div className="text-zinc-500 italic">
                              No amounts entered
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <PaymentSecuredUsingRequest />
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
