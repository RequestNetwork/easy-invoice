import type React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  callToAction?: React.ReactNode;
}

export const EmptyState = ({
  icon,
  title,
  subtitle,
  callToAction,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-zinc-900 mb-1">{title}</h3>
    <p className="text-sm text-zinc-500 text-center mb-4">{subtitle}</p>
    {callToAction}
  </div>
);
