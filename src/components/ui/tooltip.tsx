"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

interface TooltipProps {
  tooltipTrigger: ReactNode;
  tooltipContent: ReactNode;
}

export function Tooltip({ tooltipTrigger, tooltipContent }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{tooltipTrigger}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg z-50"
          sideOffset={5}
        >
          {tooltipContent}
          <RadixTooltip.Arrow className="fill-popover" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
