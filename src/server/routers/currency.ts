import { apiClient } from "@/lib/axios";
import type { AxiosResponse } from "axios";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export type ConversionCurrency = {
  id: string;
  symbol: string;
  decimals: number;
  address: string;
  type: "ERC20" | "ETH" | "ISO4217";
  network: string;
};

export interface GetConversionCurrenciesResponse {
  currencyId: string;
  network: string;
  conversionRoutes: ConversionCurrency[];
}

export const currencyRouter = router({
  getConversionCurrencies: publicProcedure
    .input(
      z.object({
        targetCurrency: z.string(),
        network: z.string(),
      }),
    )
    .query(async ({ input }): Promise<GetConversionCurrenciesResponse> => {
      const { targetCurrency, network } = input;

      const response: AxiosResponse<GetConversionCurrenciesResponse> =
        await apiClient.get(
          `v2/currencies/${targetCurrency}/conversion-routes?network=${network}`,
        );

      return response.data;
    }),
});
