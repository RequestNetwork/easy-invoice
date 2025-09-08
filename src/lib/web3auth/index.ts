import { WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";

const web3AuthOptions: Web3AuthOptions = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // or WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
  ssr: true,
};

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
};

export default web3AuthContextConfig;
