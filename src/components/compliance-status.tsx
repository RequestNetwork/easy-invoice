import { Card, CardContent } from "@/components/ui/card";
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
};

type StatusConfig = {
  icon: JSX.Element;
  text: string;
  color: string;
};

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  not_started: {
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    text: "Not Started",
    color: "bg-red-50 border-red-200 text-red-700",
  },
  initiated: {
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    text: "Initiated",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  pending: {
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    text: "Pending",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  completed: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    text: "Completed",
    color: "bg-green-50 border-green-200 text-green-700",
  },
  approved: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    text: "Completed",
    color: "bg-green-50 border-green-200 text-green-700",
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
  value: StatusType;
};

function StatusRow({ label, value }: StatusRowProps) {
  const type = label === "Agreement Status" ? "agreement" : "kyc";
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

export function ComplianceStatus({ status }: ComplianceStatusProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Compliance Status</h3>
        <div className="space-y-4">
          <StatusRow
            label="Agreement Status"
            value={status?.agreementStatus ?? "not_started"}
          />
          <StatusRow
            label="KYC Status"
            value={status?.kycStatus ?? "not_started"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
