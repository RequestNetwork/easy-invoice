"use client";

import { PaymentRoute } from "@/components/payment-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CHAIN_TO_ID, ID_TO_APPKIT_NETWORK } from "@/lib/constants/chains";
import {
  MAINNET_CURRENCIES,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import type { PaymentRoute as PaymentRouteType } from "@/lib/types";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";
import { ethers } from "ethers";
import { AlertCircle, CheckCircle, Clock, Loader2, Wallet } from "lucide-react";

import {
  getPaymentSectionStatusClass,
  getStatusDisplayText,
  getStatusIconName,
} from "@/lib/invoice-status";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type InvoiceStatus =
  | "pending"
  | "paid"
  | "crypto_paid"
  | "offramp_initiated"
  | "offramp_failed"
  | "offramp_pending"
  | "processing"
  | "overdue";

interface PaymentSectionProps {
  serverInvoice: NonNullable<Request>;
}

const getCurrencyChain = (currency: string) => {
  // Extract chain from format like "USDC-base"
  const parts = currency.split("-");
  return parts.length > 1 ? parts[1].toLowerCase() : null;
};

const REQUEST_NETWORK_CHAIN_TO_PAYMENT_NETWORK = {
  matic: "polygon",
  base: "base",
  "arbitrum-one": "arbitrum",
  arbitrum: "arbitrum",
  optimism: "optimism",
  mainnet: "ethereum",
};

const getRouteType = (route: PaymentRouteType, invoiceChain: string | null) => {
  const invoiceChainToUse =
    invoiceChain &&
    REQUEST_NETWORK_CHAIN_TO_PAYMENT_NETWORK[
      invoiceChain as keyof typeof REQUEST_NETWORK_CHAIN_TO_PAYMENT_NETWORK
    ];

  // Check if this is a crypto-to-fiat payment
  if (route.id === "REQUEST_NETWORK_PAYMENT" && route.isCryptoToFiat) {
    return {
      type: "crypto-to-fiat" as const,
      label: "Crypto-to-fiat",
      description: "Pay with crypto for a fiat invoice",
    };
  }

  if (route.id === "REQUEST_NETWORK_PAYMENT") {
    return {
      type: "direct" as const,
      label: "Direct Payment",
      description: "Pay directly on the same network",
    };
  }

  if (
    route.chain &&
    invoiceChainToUse &&
    route.chain.toLowerCase() === invoiceChainToUse
  ) {
    return {
      type: "same-chain-erc20" as const,
      label: "Same-Chain ERC20",
      description: `Pay with ${route.token} (no gas token needed)`,
    };
  }

  return {
    type: "crosschain" as const,
    label: "Crosschain Payment",
    description: `Pay from ${route.chain} network using ${route.token}`,
  };
};

export function PaymentSection({ serverInvoice }: PaymentSectionProps) {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId, switchNetwork } = useAppKitNetwork();
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<PaymentRouteType | null>(
    null,
  );

  const [invoice, setInvoice] = useState(serverInvoice);

  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>(
    serverInvoice.status as InvoiceStatus,
  );

  // Only Poll when Invoice is not paid
  const [polling, setPolling] = useState(paymentStatus !== "paid");

  // Poll the invoice status every 3 seconds until it's paid
  api.invoice.getById.useQuery(serverInvoice.id, {
    refetchInterval: polling ? 3000 : false,
    onSuccess: (data) => {
      setInvoice(data);
      if (data.status !== "pending") {
        setPaymentStatus(data.status);
      }
      if (data.status === "paid") {
        setPolling(false);
      }
    },
  });

  const [paymentProgress, setPaymentProgress] = useState("idle");
  const [currentStep, setCurrentStep] = useState(1);
  const [isAppKitReady, setIsAppKitReady] = useState(false);
  const { mutateAsync: payRequest } = api.invoice.payRequest.useMutation();
  const { mutateAsync: sendPaymentIntent } =
    api.invoice.sendPaymentIntent.useMutation();
  const { mutateAsync: setInvoiceAsProcessing } =
    api.invoice.setInvoiceAsProcessing.useMutation();

  const {
    data: paymentRoutesData,
    refetch,
    isLoading: isLoadingPaymentRoutes,
  } = api.invoice.getPaymentRoutes.useQuery(
    {
      requestId: invoice.requestId,
      walletAddress: address as string,
    },
    {
      enabled: !!address,
    },
  );

  const paymentRoutes = paymentRoutesData?.routes;
  const platformFee = paymentRoutesData?.platformFee;

  // Extract the chain from invoice currency
  const invoiceChain = getCurrencyChain(invoice.paymentCurrency);

  // A function to render the correct status icon based on status name
  const renderStatusIcon = (statusName: InvoiceStatus) => {
    const iconName = getStatusIconName(statusName);
    switch (iconName) {
      case "CheckCircle":
        return <CheckCircle className="inline-block w-4 h-4 mr-1" />;
      case "AlertCircle":
        return <AlertCircle className="inline-block w-4 h-4 mr-1" />;
      case "Clock":
        return <Clock className="inline-block w-4 h-4 mr-1" />;
    }
  };

  const displayPaymentProgress = () => {
    switch (paymentProgress) {
      case "idle":
        return "Start payment";
      case "getting-transactions":
        return "Getting payment transactions";
      case "approving":
        return "Approving payment";
      case "paying":
        return "Sending payment";
    }
  };

  useEffect(() => {
    // Simulate AppKit initialization delay
    const timer = setTimeout(() => {
      setIsAppKitReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentStep(isConnected ? 2 : 1);
  }, [isConnected]);

  useEffect(() => {
    if (address) {
      refetch();
    }
  }, [address, refetch]);

  useEffect(() => {
    if (paymentRoutes) {
      setSelectedRoute(paymentRoutes[0]);
    }
  }, [paymentRoutes]);

  const handleConnectWallet = () => {
    if (isAppKitReady) {
      open();
    }
  };

  const handleDisconnect = () => {
    if (isAppKitReady) {
      disconnect();
    }
  };

  const handleCrosschainPayments = async (paymentData: any, signer: any) => {
    const paymentIntent = JSON.parse(paymentData.paymentIntent);
    const supportsEIP2612 = paymentData.metadata.supportsEIP2612;
    let approvalSignature = undefined;
    let approval = undefined;

    setPaymentProgress("approving");

    if (supportsEIP2612) {
      approval = JSON.parse(paymentData.approvalPermitPayload);

      approvalSignature = await signer._signTypedData(
        approval.domain,
        approval.types,
        approval.values,
      );
    } else {
      const tx = await signer.sendTransaction(paymentData.approvalCalldata);
      await tx.wait();
    }

    const paymentIntentSignature = await signer._signTypedData(
      paymentIntent.domain,
      paymentIntent.types,
      paymentIntent.values,
    );

    const signedPermit = {
      signedPaymentIntent: {
        signature: paymentIntentSignature,
        nonce: paymentIntent.values.nonce.toString(),
        deadline: paymentIntent.values.deadline.toString(),
      },
      signedApprovalPermit: approvalSignature
        ? {
            signature: approvalSignature,
            nonce: approval.values.nonce.toString(),
            deadline: approval?.values?.deadline
              ? approval.values.deadline.toString()
              : approval.values.expiry.toString(),
          }
        : undefined,
    };

    setPaymentProgress("paying");

    await sendPaymentIntent({
      paymentIntent: paymentData.paymentIntentId,
      payload: signedPermit,
    });

    setPaymentStatus("processing");

    toast("Payment is being processed", {
      description: "You can safely close this page.",
    });
  };

  const handleDirectPayments = async (paymentData: any, signer: any) => {
    const isApprovalNeeded = paymentData.metadata.needsApproval;
    const paymentTransactionIndex =
      paymentData.metadata.paymentTransactionIndex;

    if (isApprovalNeeded) {
      setPaymentProgress("approving");
      toast("Payment Approval Required", {
        description: "Please approve the payment in your wallet",
      });

      // Execute all approval transactions (all transactions except the payment transaction)
      for (let i = 0; i < paymentData.transactions.length; i++) {
        if (i !== paymentTransactionIndex) {
          const approvalTransaction = await signer.sendTransaction(
            paymentData.transactions[i],
          );
          await approvalTransaction.wait();
        }
      }
    }

    setPaymentProgress("paying");

    toast("Initiating payment", {
      description: "Please confirm the payment in your wallet",
    });

    const paymentTransaction = await signer.sendTransaction(
      paymentData.transactions[paymentTransactionIndex],
    );

    await paymentTransaction.wait();

    toast("Payment is being processed", {
      description: "You can safely close this page.",
    });

    setPaymentStatus("processing");
  };

  const handlePayment = async () => {
    if (paymentProgress !== "idle") return;

    setPaymentProgress("getting-transactions");

    const targetChain =
      CHAIN_TO_ID[selectedRoute?.chain as keyof typeof CHAIN_TO_ID];

    if (targetChain !== chainId) {
      const targetAppkitNetwork =
        ID_TO_APPKIT_NETWORK[targetChain as keyof typeof ID_TO_APPKIT_NETWORK];

      toast("Switching to network", {
        description: `Switching to ${targetAppkitNetwork?.name} network`,
      });

      try {
        await switchNetwork(targetAppkitNetwork);
      } catch (_) {
        toast("Error switching network");
        return;
      }
    }

    const ethersProvider = new ethers.providers.Web3Provider(
      walletProvider as ethers.providers.ExternalProvider,
    );

    const signer = ethersProvider.getSigner();

    try {
      const paymentData = await payRequest({
        requestId: invoice.requestId,
        wallet: address,
        chain:
          selectedRoute?.id === "REQUEST_NETWORK_PAYMENT"
            ? undefined
            : selectedRoute?.chain,
        token:
          selectedRoute?.id === "REQUEST_NETWORK_PAYMENT"
            ? undefined
            : selectedRoute?.token,
      }).then((response) => response.data);

      const isPaygrid = paymentData.paymentIntentId;

      if (isPaygrid) {
        await handleCrosschainPayments(paymentData, signer);
      } else {
        await handleDirectPayments(paymentData, signer);
      }

      try {
        await setInvoiceAsProcessing({
          id: invoice.id,
        });
      } catch (statusError) {
        console.error("Status update failed:", statusError);
        toast("Payment Successful", {
          description:
            "Payment confirmed but status update failed. Please refresh.",
        });
      }
    } catch (error) {
      console.error("Error : ", error);
      toast("Payment Failed", {
        description: "Please try again",
      });
    } finally {
      setPaymentProgress("idle");
    }
  };

  const showCurrencyConversion =
    invoice.invoiceCurrency !== invoice.paymentCurrency;

  const hasRoutes = paymentRoutes && paymentRoutes.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Payment Details</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentSectionStatusClass(paymentStatus)}`}
          >
            {renderStatusIcon(paymentStatus)}
            {getStatusDisplayText(paymentStatus)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Secure Payment Section */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Secure Payment</h3>
          <p className="text-sm text-green-700">
            This payment is secured using Request Network. Your transaction will
            be processed safely and transparently.
          </p>
        </div>

        {MAINNET_CURRENCIES.includes(invoice.invoiceCurrency as any) && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Real Cryptocurrency Warning
            </h3>
            <p className="text-sm text-amber-700">
              This invoice uses{" "}
              <span className="font-bold">
                {formatCurrencyLabel(invoice.invoiceCurrency)}
              </span>{" "}
              on a mainnet blockchain, which means you'll be transferring{" "}
              <span className="font-bold">actual value</span>. EasyInvoice is a
              demonstration app and all blockchain transactions are
              irreversible.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Amount Due</Label>
          <div className="space-y-1">
            <div className="text-3xl font-bold">
              {formatCurrencyLabel(invoice.invoiceCurrency)}{" "}
              {Number(invoice.amount).toString()}
            </div>
            {showCurrencyConversion && (
              <div className="text-sm text-zinc-600">
                Payment will be processed in{" "}
                {formatCurrencyLabel(invoice.paymentCurrency)}
                <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
                  Note: The final amount in{" "}
                  {formatCurrencyLabel(invoice.paymentCurrency)} will be
                  calculated at the current exchange rate when payment is
                  initiated.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Recipient Address</Label>
          <div className="font-mono bg-zinc-100 p-2 rounded">
            {invoice.payee}
            {selectedRoute?.isCryptoToFiat && (
              <div className="mt-2 text-sm text-amber-700">
                Note: This address belongs to the Request Network Foundation for
                processing your crypto-to-fiat payment.
              </div>
            )}
          </div>
        </div>

        {/* Payment Steps */}
        {paymentStatus === "pending" && (
          <div className="space-y-8">
            {/* Step indicators */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center ${
                    currentStep >= 1 ? "text-black" : "text-zinc-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${
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
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${
                    currentStep >= 2
                      ? "border-black bg-zinc-50"
                      : "border-zinc-300"
                  }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="ml-2 font-medium">Complete Payment</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-600 text-center">
                    Connect your wallet to proceed with the payment
                  </p>
                  <Button
                    onClick={handleConnectWallet}
                    className="w-full"
                    disabled={!isAppKitReady}
                  >
                    {!isAppKitReady ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Connect Wallet"
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Connected Wallet</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={!isAppKitReady || paymentProgress !== "idle"}
                      >
                        Disconnect
                      </Button>
                    </div>
                    <div className="font-mono bg-zinc-100 p-2 rounded">
                      {address}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600">
                    Please confirm the payment amount and recipient address
                    before proceeding.
                    {showCurrencyConversion &&
                      ` Payment will be processed in ${formatCurrencyLabel(
                        invoice.paymentCurrency,
                      )}.`}
                  </p>

                  {/* Payment Route Selection */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Payment Route</Label>
                      {paymentRoutes && paymentRoutes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRoutes(!showRoutes)}
                        >
                          {showRoutes ? "Hide Options" : "See Other Options"}
                        </Button>
                      )}
                    </div>

                    {isLoadingPaymentRoutes ? (
                      <div className="p-8 border border-dashed rounded-lg">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-4">
                            <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                          </div>
                          <h3 className="text-sm font-medium text-zinc-900 mb-1">
                            Loading Payment Routes
                          </h3>
                          <p className="text-sm text-zinc-500">
                            Finding the best payment routes for your wallet
                          </p>
                        </div>
                      </div>
                    ) : !paymentRoutes || paymentRoutes.length === 0 ? (
                      <div className="p-8 border border-dashed rounded-lg">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-4">
                            <AlertCircle className="w-6 h-6 text-zinc-600" />
                          </div>
                          <h3 className="text-sm font-medium text-zinc-900 mb-1">
                            No Payment Routes Available
                          </h3>
                          <p className="text-sm text-zinc-500">
                            There are currently no available payment routes for
                            this transaction.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Selected Route Preview */}
                        {selectedRoute && (
                          <PaymentRoute
                            route={selectedRoute}
                            isSelected={true}
                            variant="selected"
                            routeType={getRouteType(
                              selectedRoute,
                              invoiceChain,
                            )}
                            platformFee={platformFee}
                          />
                        )}

                        {/* Route Options - Only show if there are multiple routes */}
                        {showRoutes && paymentRoutes.length > 1 && (
                          <div className="mt-4 space-y-2">
                            <div className="text-sm text-zinc-500 mb-3">
                              Available Payment Routes
                            </div>
                            {paymentRoutes.map((route: PaymentRouteType) => (
                              <PaymentRoute
                                key={route.id}
                                route={route}
                                isSelected={selectedRoute?.id === route.id}
                                onClick={() => setSelectedRoute(route)}
                                routeType={getRouteType(route, invoiceChain)}
                                platformFee={platformFee}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Payment button should be disabled if there are no routes */}
                  <Button
                    onClick={handlePayment}
                    className="w-full bg-black hover:bg-zinc-800 text-white"
                    disabled={paymentProgress !== "idle" || !hasRoutes}
                  >
                    {!hasRoutes ? (
                      "No payment routes available"
                    ) : paymentProgress !== "idle" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {displayPaymentProgress()}
                      </>
                    ) : (
                      displayPaymentProgress()
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
