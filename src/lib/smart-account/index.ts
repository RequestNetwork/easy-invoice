import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";

interface Transaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value: ValueInput;
}

interface BigNumberObject {
  type: "BigNumber";
  hex: string;
}

type ValueInput = number | string | bigint | BigNumberObject;

function normalizeValue(value: ValueInput): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" || typeof value === "string") {
    return BigInt(value);
  }

  if (
    value &&
    typeof value === "object" &&
    value.type === "BigNumber" &&
    value.hex
  ) {
    return BigInt(value.hex);
  }

  return BigInt(0);
}

export const useRequestSmartAccount = () => {
  const [isSubmittingTransactions, setIsSubmittingTransactions] =
    useState(false);

  const { primaryWallet } = useDynamicContext();

  const handleBatchTransactions = async ({
    transactions,
  }: {
    transactions: Transaction[];
  }) => {
    setIsSubmittingTransactions(true);
    try {
      if (!primaryWallet) {
        console.error("User does not have a primary wallet");
        return;
      }

      const { connector } = primaryWallet;

      if (!isZeroDevConnector(connector)) {
        console.error("Connector used is not a ZeroDev connector");
        return;
      }

      await connector.getNetwork();

      const kernalClient = connector.getAccountAbstractionProvider({
        withSponsorship: false,
      });

      if (!kernalClient) {
        console.error("Was not able to the kernal client");
        return;
      }

      const processedTransactions = transactions.map((transaction) => ({
        ...transaction,
        value: normalizeValue(transaction.value),
      }));

      const userOpHash = await kernalClient.sendUserOperation({
        callData: await kernalClient.account.encodeCalls(processedTransactions),
      });

      const { receipt } = await kernalClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return receipt;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err);
      }
      throw err;
    } finally {
      setIsSubmittingTransactions(false);
    }
  };

  return { handleBatchTransactions, isSubmittingTransactions };
};
