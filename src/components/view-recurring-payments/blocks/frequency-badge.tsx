"use client";

import { Badge } from "@/components/ui/badge";
import type { RecurrenceFrequencyType } from "@/server/db/schema";

const BADGE_FREQUENCY_COLOR: Record<RecurrenceFrequencyType, string> = {
  DAILY: "bg-blue-100 text-blue-800 border-blue-200",
  WEEKLY: "bg-green-100 text-green-800 border-green-200",
  MONTHLY: "bg-yellow-100 text-yellow-800 border-yellow-200",
  YEARLY: "bg-red-100 text-red-800 border-red-200",
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
