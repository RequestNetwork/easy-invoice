"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

interface TooltipProps {
  tooltipTrigger: ReactNode;
  tooltipContent: ReactNode;
}

export function Tooltip({ tooltipTrigger, tooltipContent }: TooltipProps) {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{tooltipTrigger}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50"
            sideOffset={5}
          >
            {tooltipContent}
            <RadixTooltip.Arrow className="fill-zinc-900" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
