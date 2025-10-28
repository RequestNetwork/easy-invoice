import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export type StatusType =
  | "not_started"
  | "initiated"
  | "pending"
  | "completed"
  | "approved";

type ComplianceStatusProps = {
  status:
    | {
        agreementStatus: StatusType;
        kycStatus: StatusType;
        isCompliant: boolean;
      }
    | undefined;
  isLoading?: boolean;
};

type StatusConfig = {
  icon: JSX.Element;
  text: string;
  color: string;
};

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  not_started: {
    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    text: "Not Started",
    color: "bg-destructive/10 border-destructive text-destructive-foreground",
  },
  initiated: {
    icon: <Clock className="h-5 w-5 text-warning" />,
    text: "Initiated",
    color: "bg-warning/10 border-warning text-warning-foreground",
  },
  pending: {
    icon: <Clock className="h-5 w-5 text-warning" />,
    text: "Pending",
    color: "bg-warning/10 border-warning text-warning-foreground",
  },
  completed: {
    icon: <CheckCircle className="h-5 w-5 text-success" />,
    text: "Completed",
    color: "bg-success/10 border-success text-success-foreground",
  },
  approved: {
    icon: <CheckCircle className="h-5 w-5 text-success" />,
    text: "Completed",
    color: "bg-success/10 border-success text-success-foreground",
  },
};

function getStatusConfig(
  status: StatusType,
  type: "agreement" | "kyc",
): StatusConfig {
  const config = STATUS_CONFIG[status];
  if (type === "agreement" && status === "pending") {
    return {
      ...config,
      text: "Awaiting User Signature",
    };
  }
  return config;
}

type StatusRowProps = {
  label: string;
  value?: StatusType;
  isLoading?: boolean;
};

function StatusRow({ label, value, isLoading }: StatusRowProps) {
  const type = label === "Agreement Status" ? "agreement" : "kyc";

  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{label}:</span>
        </div>
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
    );
  }

  if (!value) return null;

  const config = getStatusConfig(value, type);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{label}:</span>
      </div>
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.color}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  );
}

export function ComplianceStatus({ status, isLoading }: ComplianceStatusProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Compliance Status</h3>
        <div className="space-y-4">
          <StatusRow
            label="Agreement Status"
            value={status?.agreementStatus}
            isLoading={isLoading}
          />
          <StatusRow
            label="KYC Status"
            value={status?.kycStatus}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
