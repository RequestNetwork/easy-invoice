"use client";

import web3AuthContextConfig from "@/lib/web3auth";
import { Web3AuthProvider } from "@web3auth/modal/react";
import type { ReactNode } from "react";

export const Web3AuthAppProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      {children}
    </Web3AuthProvider>
  );
};
