"use client";

import { PaymentWidget } from "@/components/payment-widget/payment-widget";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon } from "lucide-react";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";
import { BuyerForm } from "./buyer-info";
import { CustomizeForm } from "./customize";
import { SellerForm } from "./seller-info";
import { PlaygroundValidation } from "./validation";

export const Playground = () => {
  const methods = useForm<z.infer<typeof PlaygroundValidation>>({
    resolver: zodResolver(PlaygroundValidation),
    mode: "onChange",
    defaultValues: {
      amountInUsd: "0",
      recipientWallet: "",
      paymentConfig: {
        reference: undefined,
        walletConnectProjectId: undefined,
        rnApiClientId: "YOUR_CLIENT_ID_HERE",
        supportedCurrencies: [],
        feeInfo: undefined,
      },
      uiConfig: {
        showRequestScanUrl: true,
        showReceiptDownload: true,
      },
      receiptInfo: {
        companyInfo: {
          name: "",
          taxId: "",
          email: "",
          phone: "",
          website: "",
        },
        buyerInfo: {
          email: "",
          firstName: "",
          lastName: "",
          businessName: "",
          phone: "",
        },
        items: [
          {
            id: "1",
            description: "",
            quantity: 1,
            unitPrice: "0",
            total: "0",
            currency: "USD",
          },
        ],
        totals: {
          totalDiscount: "0",
          totalTax: "0",
          total: "0",
          totalUSD: "0",
        },
        invoiceNumber: "",
      },
    },
  });

  const formValues = methods.watch();
  const [copied, setCopied] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const generateIntegrationCode = () => {
    const formatObject = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      const nextSpaces = " ".repeat(indent + 2);

      if (typeof obj !== "object" || obj === null) {
        return JSON.stringify(obj);
      }

      if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";

        const arrayItems = obj
          .filter((item) => item !== undefined && item !== null)
          .map((item) => {
            if (typeof item === "object" && item !== null) {
              return `${nextSpaces}${formatObject(item, indent + 2)}`;
            }
            return `${nextSpaces}${JSON.stringify(item)}`;
          });

        return `[\n${arrayItems.join(",\n")}\n${spaces}]`;
      }

      const entries = Object.entries(obj)
        .filter(
          ([_, value]) => value !== undefined && value !== null && value !== "",
        )
        .map(([key, value]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            Object.keys(value).length > 0
          ) {
            return `${nextSpaces}${key}: ${formatObject(value, indent + 2)}`;
          }
          return `${nextSpaces}${key}: ${JSON.stringify(value)}`;
        });

      if (entries.length === 0) return "{}";

      return `{\n${entries.join(",\n")}\n${spaces}}`;
    };

    const paymentConfig = formValues.paymentConfig;
    const cleanedPaymentConfig = {
      ...paymentConfig,
      supportedCurrencies: paymentConfig.supportedCurrencies?.length
        ? paymentConfig.supportedCurrencies
        : undefined,
      feeInfo:
        paymentConfig.feeInfo?.feeAddress ||
        paymentConfig.feeInfo?.feePercentage !== "0"
          ? paymentConfig.feeInfo
          : undefined,
    };

    const cleanedreceiptInfo = {
      ...formValues.receiptInfo,
      buyerInfo: Object.values(formValues.receiptInfo.buyerInfo || {}).some(
        (val) => val,
      )
        ? formValues.receiptInfo.buyerInfo
        : undefined,
    };

    return `<PaymentWidget
  amountInUsd="${formValues.amountInUsd}"
  recipientWallet="${formValues.recipientWallet}"
  paymentConfig={${formatObject(cleanedPaymentConfig, 2)}}${
    formValues.uiConfig
      ? `
  uiConfig={${formatObject(formValues.uiConfig, 2)}}`
      : ""
  }
  receiptInfo={${formatObject(cleanedreceiptInfo, 2)}}
  onPaymentSuccess={(requestId) => {
    console.log('Payment successful', requestId);
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
  }}
  onComplete={() => {
    console.log('Payment process completed');
  }}
>
  {/* Custom button example */}
  <div className="px-8 py-2 bg-[#099C77] text-white rounded-lg hover:bg-[#087f63] transition-colors text-center">
    Pay with crypto
  </div>
</PaymentWidget>`;
  };

  const integrationCode = generateIntegrationCode();
  const installCommand = "npx shadcn add @requestnetwork/payment-widget";

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(integrationCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const copyInstallCommand = () => {
    navigator.clipboard
      .writeText(installCommand)
      .then(() => {
        setCopiedInstall(true);
        setTimeout(() => setCopiedInstall(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col gap-4 mt-4">
        <section className="flex flex-col gap-6 lg:gap-4 items-center md:items-start md:justify-between lg:flex-row">
          <div className="flex flex-col gap-4 w-full lg:w-1/2">
            <Tabs defaultValue="customize" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="customize">Customize Widget</TabsTrigger>
                <TabsTrigger value="seller">Company Info</TabsTrigger>
                <TabsTrigger value="buyer">Buyer Info</TabsTrigger>
              </TabsList>
              <TabsContent value="customize" className="mt-6">
                <CustomizeForm />
              </TabsContent>
              <TabsContent value="seller" className="mt-6">
                <SellerForm />
              </TabsContent>
              <TabsContent value="buyer" className="mt-6">
                <BuyerForm />
              </TabsContent>
            </Tabs>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-start gap-4">
            <h2 className="font-semibold">Preview</h2>
            <PaymentWidget
              amountInUsd={formValues.amountInUsd}
              recipientWallet={formValues.recipientWallet}
              paymentConfig={formValues.paymentConfig}
              uiConfig={formValues.uiConfig}
              receiptInfo={formValues.receiptInfo}
              onPaymentSuccess={(requestId) =>
                console.log("Payment successful:", requestId)
              }
              onPaymentError={(error) =>
                console.error("Payment failed:", error)
              }
              onComplete={() => console.log("Payment process completed")}
            >
              <div className="px-8 py-2 bg-[#099C77] text-white rounded-lg hover:bg-[#087f63] transition-colors text-center">
                Pay with crypto
              </div>
            </PaymentWidget>

            <div className="mt-8 w-full space-y-4">
              <h2 className="font-semibold">Integration Code</h2>

              {/* Install Command */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 px-2 z-10"
                  onClick={copyInstallCommand}
                >
                  <CopyIcon className="h-4 w-4" />
                  <span className="ml-2 text-xs">
                    {copiedInstall ? "Copied!" : "Copy"}
                  </span>
                </Button>
                <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto pr-24">
                  <code className="language-bash text-sm">
                    {installCommand}
                  </code>
                </pre>
              </div>

              {/* Integration Code */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 px-2 z-10"
                  onClick={copyToClipboard}
                >
                  <CopyIcon className="h-4 w-4" />
                  <span className="ml-2 text-xs">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </Button>
                <pre
                  ref={codeRef}
                  className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto pr-24"
                >
                  <code className="language-jsx text-sm">
                    {integrationCode}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </FormProvider>
  );
};
