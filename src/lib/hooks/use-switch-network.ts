import { useAppKitNetwork } from "@reown/appkit/react";
import type { Chain } from "viem";
import { ID_TO_APPKIT_NETWORK } from "../constants/chains";
import { getChainFromPaymentCurrency } from "../helpers/chain";
import { type RetryHooks, retry } from "../utils";

export const useSwitchNetwork = () => {
  const { switchNetwork, chainId } = useAppKitNetwork();

  const switchWithRetry = (chain: Chain, opts?: RetryHooks<void>) => {
    retry(() => Promise.resolve(switchNetwork(chain)), {
      retries: 3,
      delay: 0,
      ...opts,
    });
  };

  const switchToPaymentNetwork = (
    paymentCurrency: string,
    opts?: RetryHooks<void>,
  ) => {
    const targetChain = getChainFromPaymentCurrency(paymentCurrency);

    if (chainId !== targetChain.id) {
      switchWithRetry(targetChain, opts);
    }
  };

  const switchToChainId = (chainId: number, opts?: RetryHooks<void>) => {
    const targetChain =
      ID_TO_APPKIT_NETWORK[chainId as keyof typeof ID_TO_APPKIT_NETWORK];

    switchWithRetry(targetChain, opts);
  };

  return { switchToPaymentNetwork, switchToChainId, chainId };
};
