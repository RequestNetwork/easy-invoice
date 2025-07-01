"use client";

import { Badge } from "@/components/ui/badge";
import type { RecurringPaymentStatusType } from "@/server/db/schema";

const BADGE_STATUS_COLOR: Record<RecurringPaymentStatusType, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

interface StatusBadgeProps {
  status: RecurringPaymentStatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={BADGE_STATUS_COLOR[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
