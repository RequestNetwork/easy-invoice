import { RN_API_URL } from "../constants";

export type ConversionCurrency = {
  id: string;
  symbol: string;
  decimals: number;
  address: string;
  name: string;
  type: "ERC20" | "ETH" | "ISO4217";
  network: string;
};

export interface GetConversionCurrenciesResponse {
  currencyId: string;
  network: string;
  conversionRoutes: ConversionCurrency[];
}

const DEFAULT_CURRENCY = "USD";

// TODO: optimize to use the new ?networks search param
export const getConversionCurrencies = async (
  rnApiClientId: string,
): Promise<ConversionCurrency[]> => {
  const response = await fetch(
    `${RN_API_URL}/v2/currencies/${DEFAULT_CURRENCY}/conversion-routes`,
    {
      headers: {
        "x-client-id": rnApiClientId,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data: GetConversionCurrenciesResponse = await response.json();

  return data.conversionRoutes;
};

export const getSymbolOverride = (symbol: string) => {
  switch (symbol.toLowerCase()) {
    case "eth-sepolia":
      return "ETH";
    default:
      return symbol;
  }
};
