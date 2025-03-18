import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "@reown/appkit/networks";

export const CHAIN_TO_ID = {
  SEPOLIA: 11155111,
  BASE: 8453,
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
};

export const ID_TO_APPKIT_NETWORK = {
  [sepolia.id]: sepolia,
  [base.id]: base,
  [mainnet.id]: mainnet,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [polygon.id]: polygon,
};
