import { useAppKitNetwork } from "@reown/appkit/react";
import type { Chain } from "viem";
import { ID_TO_APPKIT_NETWORK } from "../constants/chains";
import { type RetryHooks, retry } from "../helpers";
import { getChainFromPaymentCurrency } from "../helpers/chain";

export const useSwitchNetwork = () => {
  const { switchNetwork, chainId } = useAppKitNetwork();

  const switchWithRetry = async (chain: Chain, opts?: RetryHooks<void>) => {
    return await retry(() => Promise.resolve(switchNetwork(chain)), {
      retries: 3,
      delay: 0,
      ...opts,
    });
  };

  const switchToPaymentNetwork = async (
    paymentCurrency: string,
    opts?: RetryHooks<void>,
  ) => {
    const targetChain = getChainFromPaymentCurrency(paymentCurrency);

    if (chainId === targetChain.id) return;
    await switchWithRetry(targetChain, opts);
  };

  const switchToChainId = async (
    targetChainId: number,
    opts?: RetryHooks<void>,
  ) => {
    if (chainId === targetChainId) return;
    const targetChain =
      ID_TO_APPKIT_NETWORK[targetChainId as keyof typeof ID_TO_APPKIT_NETWORK];

    await switchWithRetry(targetChain, opts);
  };

  return { switchToPaymentNetwork, switchToChainId, chainId };
};
