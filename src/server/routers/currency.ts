import { apiClient } from "@/lib/axios";
import { TRPCError } from "@trpc/server";
import type { AxiosResponse } from "axios";
import axios from "axios";
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

      try {
        const response: AxiosResponse<GetConversionCurrenciesResponse> =
          await apiClient.get(
            `v2/currencies/${targetCurrency}/conversion-routes?network=${network}`,
          );

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;
          const code =
            statusCode === 404
              ? "NOT_FOUND"
              : statusCode === 400
                ? "BAD_REQUEST"
                : "INTERNAL_SERVER_ERROR";

          throw new TRPCError({
            code,
            message: error.response?.data?.message || error.message,
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversion currencies",
        });
      }
    }),
});
