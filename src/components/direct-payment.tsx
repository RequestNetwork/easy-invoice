"use client";

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

export function DirectPayment() {
  // State for payment form
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [invoiceCurrency, setInvoiceCurrency] =
    useState<InvoiceCurrency>("USD");
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(
    "ETH-sepolia-sepolia",
  );

  // Payment processing states
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);

  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnected) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [isConnected]);

  const handleSubmitPayment = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || !payee) {
      toast.error("Please fill in all required fields");
      return;
    }

    setPaymentStatus("processing");

    try {
      // Get ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );

      const signer = await ethersProvider.getSigner();

      // First step: Call the /pay endpoint to initiate the payment
      toast.info("Initiating payment...");

      // Make the API call to the /pay endpoint
      const response = await fetch("https://api.request.network/v1/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.NEXT_PUBLIC_REQUEST_API_KEY || "",
        },
        body: JSON.stringify({
          payee,
          amount,
          invoiceCurrency,
          paymentCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.statusText}`);
      }

      const paymentData = await response.json();

      // Check if approval is needed first
      const isApprovalNeeded = paymentData.metadata?.needsApproval;

      if (isApprovalNeeded) {
        toast.info("Approval required", {
          description: "Please approve the transaction in your wallet",
        });

        const approvalIndex = paymentData.metadata.approvalTransactionIndex;

        // Send the approval transaction
        const approvalTransaction = await signer.sendTransaction(
          paymentData.transactions[approvalIndex],
        );

        // Wait for the approval transaction to be mined
        await approvalTransaction.wait();
      }

      // Now send the actual payment transaction
      toast.info("Sending payment", {
        description: "Please confirm the transaction in your wallet",
      });

      const paymentTransaction = await signer.sendTransaction(
        paymentData.transactions[isApprovalNeeded ? 1 : 0],
      );

      // Wait for the payment transaction to be mined
      await paymentTransaction.wait();

      toast.success("Payment successful", {
        description: `You've paid ${amount} ${formatCurrencyLabel(invoiceCurrency)} to ${payee.substring(0, 6)}...${payee.substring(payee.length - 4)}`,
      });

      setPaymentStatus("success");

      // Reset form after successful payment
      setTimeout(() => {
        setAmount("");
        setPayee("");
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

  // Handle currency change and ensure payment currency is valid for invoice currency
  const handleInvoiceCurrencyChange = (value: string) => {
    const newInvoiceCurrency = value as InvoiceCurrency;
    setInvoiceCurrency(newInvoiceCurrency);

    // Set default payment currency based on invoice currency
    const validPaymentCurrencies =
      getPaymentCurrenciesForInvoice(newInvoiceCurrency);
    setPaymentCurrency(validPaymentCurrencies[0]);
  };

  // Check if the selected invoice currency requires payment currency selection
  const showPaymentCurrencySelect = invoiceCurrency === "USD";

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

        {isLoading ? (
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
                <div className="space-y-4">
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
                      </div>

                      {showPaymentCurrencySelect && (
                        <div className="space-y-2">
                          <Label htmlFor="paymentCurrency">
                            Payment Currency
                          </Label>
                          <Select
                            value={paymentCurrency}
                            onValueChange={(value) =>
                              setPaymentCurrency(value as PaymentCurrency)
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
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pr-12"
                        disabled={paymentStatus === "processing"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Address</Label>
                      <Input
                        id="recipient"
                        placeholder="0x..."
                        value={payee}
                        onChange={(e) => setPayee(e.target.value)}
                        disabled={paymentStatus === "processing"}
                        className="font-mono"
                      />
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
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-2 pb-6">
              {currentStep === 2 && (
                <>
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
                    onClick={handleSubmitPayment}
                    disabled={
                      paymentStatus === "processing" || !amount || !payee
                    }
                    className="relative"
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
                </>
              )}
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
