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

function getStatusIconForAgreement(status: StatusType) {
  switch (status) {
    case "initiated":
      return <Clock className="h-5 w-5 text-amber-500" />;
    case "completed":
    case "approved":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "pending":
      return <Clock className="h-5 w-5 text-amber-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
}

function getStatusTextForAgreement(status: StatusType) {
  switch (status) {
    case "initiated":
      return "Initiated";
    case "completed":
    case "approved":
      return "Completed";
    case "pending":
      return "Awaiting User Signature";
    default:
      return "Not Started";
  }
}

function getStatusColorForAgreement(status: StatusType) {
  switch (status) {
    case "initiated":
      return "bg-amber-50 border-amber-200 text-amber-700";
    case "completed":
    case "approved":
      return "bg-green-50 border-green-200 text-green-700";
    case "pending":
      return "bg-amber-50 border-amber-200 text-amber-700";
    default:
      return "bg-red-50 border-red-200 text-red-700";
  }
}

function getStatusIconForKyc(status: StatusType) {
  switch (status) {
    case "initiated":
      return <Clock className="h-5 w-5 text-amber-500" />;
    case "completed":
    case "approved":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "pending":
      return <Clock className="h-5 w-5 text-amber-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
}

function getStatusTextForKyc(status: StatusType) {
  switch (status) {
    case "initiated":
      return "Initiated";
    case "completed":
    case "approved":
      return "Completed";
    case "pending":
      return "Pending";
    default:
      return "Not Started";
  }
}

function getStatusColorForKyc(status: StatusType) {
  switch (status) {
    case "initiated":
      return "bg-amber-50 border-amber-200 text-amber-700";
    case "completed":
    case "approved":
      return "bg-green-50 border-green-200 text-green-700";
    case "pending":
      return "bg-amber-50 border-amber-200 text-amber-700";
    default:
      return "bg-red-50 border-red-200 text-red-700";
  }
}

type StatusRowProps = {
  label: string;
  value: StatusType;
};

function StatusRow({ label, value }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{label}:</span>
      </div>
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border ${label === "Agreement Status" ? getStatusColorForAgreement(value) : getStatusColorForKyc(value)}`}
      >
        {label === "Agreement Status"
          ? getStatusIconForAgreement(value)
          : getStatusIconForKyc(value)}
        <span className="text-sm font-medium">
          {label === "Agreement Status"
            ? getStatusTextForAgreement(value)
            : getStatusTextForKyc(value)}
        </span>
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
