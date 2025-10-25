"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Download } from "lucide-react";
import {
  createReceipt,
  generateReceiptNumber,
  type CreateReceiptParams,
} from "../utils/receipt";
import { useRef } from "react";
import { ReceiptPDFTemplate } from "../components/receipt/receipt-template";
import type { BuyerInfo } from "../types/index";
import type { ConversionCurrency } from "../utils/currencies";
import { usePaymentWidgetContext } from "../context/payment-widget-context/use-payment-widget-context";

interface PaymentSuccessProps {
  requestId: string;
  txHash: string;
  selectedCurrency: ConversionCurrency;
  buyerInfo: BuyerInfo;
}

export function PaymentSuccess({
  requestId,
  txHash,
  selectedCurrency,
  buyerInfo,
}: PaymentSuccessProps) {
  const {
    amountInUsd,
    recipientWallet,
    connectedWalletAddress,
    receiptInfo,
    uiConfig,
  } = usePaymentWidgetContext();
  const receiptRef = useRef<HTMLDivElement>(null);

  const receiptParams: CreateReceiptParams = {
    company: {
      ...receiptInfo.companyInfo,
      walletAddress: recipientWallet,
    },
    buyer: {
      ...buyerInfo,
      walletAddress: connectedWalletAddress || "",
    },
    payment: {
      amount: amountInUsd,
      chain: selectedCurrency.network,
      currency: selectedCurrency.symbol,
      exchangeRate: "1",
      transactionHash: txHash,
    },
    items: receiptInfo.items,
    totals: receiptInfo.totals,
    metadata: {
      receiptNumber: receiptInfo?.receiptNumber
        ? receiptInfo.receiptNumber
        : generateReceiptNumber(),
      notes: `Payment processed through Request Network for ${amountInUsd} USD`,
    },
  };

  const handleDownloadReceipt = async () => {
    try {
      const element = receiptRef.current;
      if (!element) {
        console.error("Receipt element not found");
        return;
      }

      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      let imgWidth = pageWidth - margin * 2;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxHeight = pageHeight - margin * 2;
      if (imgHeight > maxHeight) {
        const ratio = maxHeight / imgHeight;
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;
      }
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(
        `receipt-${receiptParams.metadata?.receiptNumber || "payment"}.pdf`,
      );
    } catch (error) {
      console.error("Failed to download receipt:", error);
      alert("Failed to download receipt. Please try again.");
    }
  };

  const requestScanUrl = `https://scan.request.network/request/${requestId}`;

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="flex flex-col items-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-600">
            Payment Completed!
          </h3>
          <p className="text-gray-600 mt-2">
            Your payment has been processed successfully.
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-3 w-full">
        {uiConfig.showReceiptDownload && (
          <>
            <Button onClick={handleDownloadReceipt} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt PDF
            </Button>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                top: 0,
                opacity: 0,
                pointerEvents: "none",
                width: "800px",
                backgroundColor: "white",
              }}
            >
              <div ref={receiptRef}>
                <ReceiptPDFTemplate receipt={createReceipt(receiptParams)} />
              </div>
            </div>
          </>
        )}
        {uiConfig.showRequestScanUrl && (
          <Button variant="outline" asChild className="w-full">
            <a
              href={requestScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Request Scan
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
