import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

type ComplianceStatusProps = {
  status: {
    agreementStatus: "not_started" | "pending" | "completed";
    kycStatus: "not_started" | "pending" | "completed";
  };
};

export function ComplianceStatus({ status }: ComplianceStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      default:
        return "Not Started";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200 text-green-700";
      case "pending":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-red-50 border-red-200 text-red-700";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Compliance Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Agreement Status: &nbsp;</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(status.agreementStatus)}`}
            >
              {getStatusIcon(status.agreementStatus)}
              <span className="text-sm font-medium">
                {getStatusText(status.agreementStatus)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>KYC Status:</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(status.kycStatus)}`}
            >
              {getStatusIcon(status.kycStatus)}
              <span className="text-sm font-medium">
                {getStatusText(status.kycStatus)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
