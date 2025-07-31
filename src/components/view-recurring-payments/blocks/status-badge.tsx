"use client";

import { Badge } from "@/components/ui/badge";
import type { RecurringPaymentStatusType } from "@/server/db/schema";

const BADGE_STATUS_COLOR: Record<RecurringPaymentStatusType, string> = {
  pending: "bg-warning/10 text-warning-foreground border-warning",
  active: "bg-success/10 text-success-foreground border-success",
  paused: "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/10 text-primary-foreground border-primary",
  cancelled: "bg-destructive/10 text-destructive-foreground border-destructive",
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
