"use client";

import { type PropsWithChildren, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectionHandler } from "./components/connection-handler";
import { Web3Provider } from "./context/web3-context";
import { PaymentModal } from "./components/payment-modal";
import { PaymentWidgetProvider } from "./context/payment-widget-context/payment-widget-provider";
import type { PaymentWidgetProps } from "./payment-widget.types";
import { ICONS } from "./constants";
import { usePaymentWidgetContext } from "./context/payment-widget-context/use-payment-widget-context";

function PaymentWidgetInner({ children }: PropsWithChildren) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
  };

  const {
    walletAccount,
    paymentConfig: { rnApiClientId, supportedCurrencies },
  } = usePaymentWidgetContext();

  let isButtonDisabled = false;

  if (!rnApiClientId || rnApiClientId === "") {
    console.error("PaymentWidget: rnApiClientId is required in paymentConfig");

    isButtonDisabled = true;
  }

  if (supportedCurrencies.length === 0) {
    console.error(
      "PaymentWidget: supportedCurrencies is required in paymentConfig",
    );

    isButtonDisabled = true;
  }

  return (
    <div className="inline-flex flex-col items-center">
      <Button
        disabled={isButtonDisabled}
        onClick={() => {
          if (isButtonDisabled) return;
          setIsModalOpen(true);
        }}
        variant="ghost"
        className="p-0 h-auto bg-transparent hover:bg-transparent"
      >
        {children || "Pay with crypto"}
      </Button>

      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <img
          src={ICONS.requestNetwork}
          alt="Request Network"
          width={10}
          height={10}
          className="flex-shrink-0"
        />
        <span>Powered by Request Network</span>
      </div>

      {walletAccount !== undefined ? (
        <PaymentModal
          isOpen={isModalOpen}
          handleModalOpenChange={handleModalOpenChange}
        />
      ) : (
        <ConnectionHandler
          isOpen={isModalOpen}
          handleModalOpenChange={handleModalOpenChange}
          paymentModal={
            <PaymentModal
              isOpen={isModalOpen}
              handleModalOpenChange={handleModalOpenChange}
            />
          }
        />
      )}
    </div>
  );
}

export function PaymentWidget({
  amountInUsd,
  recipientWallet,
  paymentConfig,
  receiptInfo,
  onPaymentSuccess,
  onPaymentError,
  uiConfig,
  walletAccount,
  children,
}: PaymentWidgetProps) {
  return (
    <Web3Provider walletConnectProjectId={paymentConfig.walletConnectProjectId}>
      <PaymentWidgetProvider
        amountInUsd={amountInUsd}
        recipientWallet={recipientWallet}
        walletAccount={walletAccount}
        paymentConfig={paymentConfig}
        uiConfig={uiConfig}
        receiptInfo={receiptInfo}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      >
        <PaymentWidgetInner>{children}</PaymentWidgetInner>
      </PaymentWidgetProvider>
    </Web3Provider>
  );
}
