"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface ShortAddressProps {
  address: string;
  className?: string;
}

export function ShortAddress({ address, className = "" }: ShortAddressProps) {
  const shortAddress = `${address.substring(0, 6)}...${address.substring(
    address.length - 4,
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <Tooltip
      tooltipTrigger={
        <button
          type="button"
          onClick={handleCopy}
          className={`text-zinc-500 hover:text-zinc-700 transition-colors flex items-center gap-2 ${className}`}
        >
          <span className="font-mono text-sm">{shortAddress}</span>
          <Copy className="h-3 w-3" />
        </button>
      }
      tooltipContent={<span>Copy address</span>}
    />
  );
}
