"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { getWagmiConfig } from "../utils/wagmi";
import { type ReactNode, useMemo, useRef } from "react";

const queryClient = new QueryClient();

export function Web3Provider({
  children,
  walletConnectProjectId,
}: {
  children: ReactNode;
  walletConnectProjectId?: string;
}) {
  // @NOTE this may seem weird, but walletConnect doesn't handle strict mode initializing it twice, so we explicitly use a ref to store the config
  const configRef = useRef<ReturnType<typeof getWagmiConfig> | null>(null);

  const wagmiConfig = useMemo(() => {
    if (!configRef.current) {
      configRef.current = getWagmiConfig(walletConnectProjectId);
    }
    return configRef.current;
  }, [walletConnectProjectId]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
