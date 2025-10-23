import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";

export function DisconnectWallet() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="flex flex-row items-center my-2">
      <Wallet className="text-primary mr-2" size={32} />
      <span className="text-sm font-mono text-muted-foreground">
        {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
      </span>
      <Button
        variant="outline"
        onClick={handleDisconnect}
        className="text-sm ml-auto"
      >
        Disconnect
      </Button>
    </div>
  );
}
