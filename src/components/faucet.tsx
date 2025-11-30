import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "./ui/input";

import { useSwitchNetwork } from "@/lib/hooks/use-switch-network";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { useMutation } from "@tanstack/react-query";
import { ethers } from "ethers";
import { useState } from "react";
import { toast } from "sonner";
import { type Hex, encodeFunctionData, parseAbi, parseUnits } from "viem";
import { Button } from "./ui/button";

const faucetTokens = [
  {
    id: "FAU-sepolia",
    name: "FAU",
    symbol: "FAU",
    decimals: 18,
    address: "0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C",
    network: "sepolia",
    type: "ERC20",
    hash: "0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C",
    chainId: 11155111,
  },
  {
    id: "fUSDT-sepolia",
    name: "fUSDT",
    symbol: "fUSDT",
    decimals: 6,
    address: "0xF046b3CA5ae2879c6bAcC4D42fAF363eE8379F78",
    network: "sepolia",
    type: "ERC20",
    hash: "0xF046b3CA5ae2879c6bAcC4D42fAF363eE8379F78",
    chainId: 11155111,
  },
] as const;

export const FaucetTokens = () => {
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();
  const { chainId, switchToChainId } = useSwitchNetwork();

  const { walletProvider } = useAppKitProvider("eip155");
  const [token, setToken] = useState("FAU-sepolia");
  const [amount, setAmount] = useState(0);

  const mintHandler = useMutation({
    mutationFn: async () => {
      if (!isConnected || !address) {
        open();
        throw new Error("Connect Wallet to mint tokens");
      }

      const selectedToken = faucetTokens.find((t) => t.id === token);
      if (!selectedToken) throw new Error("Invalid token");

      if (chainId !== selectedToken.chainId) {
        await switchToChainId(selectedToken.chainId);
      }

      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider as ethers.providers.ExternalProvider,
      );
      const signer = ethersProvider.getSigner();

      if (!signer) throw new Error("No signer found");

      const parsedAmount = parseUnits(
        amount.toString(),
        selectedToken.decimals ?? 18,
      );

      const id = toast.loading("Minting tokens...");

      const tx = await signer.sendTransaction({
        to: selectedToken.address,
        data: encodeFunctionData({
          abi: parseAbi(["function mint(address to, uint256 amount) public"]),
          functionName: "mint",
          args: [address as Hex, parsedAmount],
        }),
      });

      await tx.wait();

      toast.loading("Waiting for confirmation...", { id });

      return {
        hash: tx.hash,
        id,
      };
    },
    onSuccess: (data) => {
      toast.success("Tokens minted successfully", { id: data.id });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message);
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild={true}>
        <Button
          variant="outline"
          size="icon"
          className="[&_svg]:size-5 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Faucet Icon</title>
            <path d="M10.22 4.9 5.4 6H5a2 2 0 0 1 0-4h.4l4.86 1" />
            <circle cx="12" cy="4" r="2" />
            <path d="m13.78 4.9 4.8 1h.4a2 2 0 0 0 0-4h-.4l-4.92 1" />
            <path d="M12 6v3" />
            <rect width="4" height="6" x="18" y="10" />
            <path d="M22 9v8" />
            <path d="M18 11h-2.6a3.87 3.87 0 0 0-6.8 0H7c-2.8 0-5 2.2-5 5v1h4v-1c0-.6.4-1 1-1h1.6a3.87 3.87 0 0 0 6.8 0H18" />
            <path d="M3.5 17S2 19 2 20a2 2 0 0 0 4 0c0-1-1.5-3-1.5-3" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pb-6">Get Faucet Tokens</DialogTitle>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="font-medium text-sm">Token Name</div>
              <Select value={token} onValueChange={(value) => setToken(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Token" />
                </SelectTrigger>
                <SelectContent>
                  {faucetTokens.map((token) => (
                    <SelectItem key={token.id} value={token.id}>
                      {token.name} ({token.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-medium text-sm">Amount</div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (Number.isNaN(val)) setAmount(0);
                  setAmount(Number(val));
                }}
              />
            </div>

            <Button
              disabled={!amount || amount <= 0 || mintHandler.isPending}
              onClick={async () => {
                await mintHandler.mutateAsync();
              }}
            >
              Mint Tokens
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
