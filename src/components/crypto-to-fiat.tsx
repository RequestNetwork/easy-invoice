import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@/server/db/schema";
import { AlertTriangle } from "lucide-react";
import { ComplianceForm } from "./compliance-form";

export function CryptoToFiat({ user }: { user: User }) {
  return (
    <div className="flex justify-center mx-auto w-full">
      <Card className="w-[800px] shadow-lg border-zinc-200/80">
        <CardContent className="p-8">
          {!user.isCompliant && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">
                  Compliance Required
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  To send Crypto-to-fiat payments, you need to complete KYC
                  verification and sign the compliance agreement.
                </p>
              </div>
            </div>
          )}
          <div className="w-full">
            <ComplianceForm user={user} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
