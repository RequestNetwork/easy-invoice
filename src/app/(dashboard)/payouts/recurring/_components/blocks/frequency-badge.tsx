"use client";

import { Badge } from "@/components/ui/badge";
import type { RecurrenceFrequencyType } from "@/server/db/schema";

const BADGE_FREQUENCY_COLOR: Record<RecurrenceFrequencyType, string> = {
  DAILY: "bg-primary/10 text-primary-foreground border-primary",
  WEEKLY: "bg-success/10 text-success-foreground border-success",
  MONTHLY: "bg-warning/10 text-warning-foreground border-warning",
  YEARLY: "bg-destructive/10 text-destructive-foreground border-destructive",
};

interface FrequencyBadgeProps {
  frequency: RecurrenceFrequencyType;
}

export function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  return (
    <Badge variant="outline" className={BADGE_FREQUENCY_COLOR[frequency]}>
      {frequency}
    </Badge>
  );
}
