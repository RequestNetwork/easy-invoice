"use client";

import { ShortAddress } from "@/components/short-address";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import type { RecurringPayment } from "@/server/db/schema";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";

interface CompletedPaymentsProps {
  payments: RecurringPayment["payments"];
}

export function CompletedPayments({ payments }: CompletedPaymentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!payments || payments.length === 0) {
    return <div className="text-xs text-zinc-500">No payments yet</div>;
  }

  const visiblePayments = isExpanded ? payments : payments.slice(0, 2);

  return (
    <div className="space-y-2">
      {visiblePayments.map((payment) => (
        <div
          key={`payment_${payment.txHash}`}
          className="text-sm space-y-1 font-normal"
        >
          <div>{formatDate(payment.date)}</div>
          {payment.requestScanUrl ? (
            <a
              href={payment.requestScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
            >
              View transaction
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <ShortAddress address={payment.txHash} className="text-xs" />
          )}
        </div>
      ))}
      {payments.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 px-2 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show {payments.length - 2} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}
