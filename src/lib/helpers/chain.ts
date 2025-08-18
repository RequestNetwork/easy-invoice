import { ID_TO_APPKIT_NETWORK, NETWORK_TO_ID } from "../constants/chains";

export const getChainFromPaymentCurrency = (paymentCurrency: string) => {
  const parts = paymentCurrency.split("-");
  const paymentNetwork = parts.length > 1 ? parts.at(-1) : "sepolia";
  const targetChain =
    NETWORK_TO_ID[paymentNetwork as keyof typeof NETWORK_TO_ID];

  return ID_TO_APPKIT_NETWORK[targetChain as keyof typeof ID_TO_APPKIT_NETWORK];
};
