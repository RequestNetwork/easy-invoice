"use client";

import web3AuthContextConfig from "@/lib/web3auth";
import type { IWeb3AuthState } from "@web3auth/modal";
import { Web3AuthProvider } from "@web3auth/modal/react";
import type { ReactNode } from "react";
export const Web3AuthAppProvider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: IWeb3AuthState | undefined;
}) => {
  return (
    <Web3AuthProvider
      config={web3AuthContextConfig}
      initialState={initialState}
    >
      {children}
    </Web3AuthProvider>
  );
};
