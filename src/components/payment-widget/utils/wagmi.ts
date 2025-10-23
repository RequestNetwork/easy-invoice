import { createConfig, http, type CreateConnectorFn } from "wagmi";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";
import {
  injected,
  coinbaseWallet,
  metaMask,
  safe,
  walletConnect,
} from "wagmi/connectors";

export const getWagmiConfig = (walletConnectProjectId?: string) => {
  const connectors: CreateConnectorFn[] = [
    injected(),
    coinbaseWallet({
      appName: "Request Network Payment",
    }),
    metaMask(),
    safe(),
  ];

  if (walletConnectProjectId && walletConnectProjectId.length > 0) {
    try {
      const connector = walletConnect({
        projectId: walletConnectProjectId,
        metadata: {
          name: "Request Network Payment",
          description: "Pay with cryptocurrency using Request Network",
          url: "https://request.network",
          icons: ["https://request.network/favicon.ico"],
        },
        showQrModal: true,
      });

      connectors.push(connector);
    } catch (error) {
      console.error("WalletConnect creation failed:", error);
    }
  }

  const config = createConfig({
    chains: [mainnet, sepolia, arbitrum, optimism, polygon, base],
    connectors,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [polygon.id]: http(),
      [base.id]: http(),
    },
  });

  return config;
};
