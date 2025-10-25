"use client";

import { useAccount } from "wagmi";
import { WalletConnectModal } from "./wallet-connect-modal";
import type { ReactNode } from "react";

interface ConnectionHandlerProps {
  isOpen: boolean;
  handleModalOpenChange: (open: boolean) => void;
  paymentModal: ReactNode;
}

export function ConnectionHandler({
  isOpen,
  handleModalOpenChange,
  paymentModal,
}: ConnectionHandlerProps) {
  const { isConnected, isConnecting } = useAccount();

  if (!isConnected) {
    return (
      <WalletConnectModal
        isLoading={isConnecting}
        isOpen={isOpen}
        handleModalOpenChange={handleModalOpenChange}
      />
    );
  }
  return paymentModal;
}
