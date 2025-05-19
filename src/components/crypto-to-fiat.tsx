import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { User } from "@/server/db/schema";
import { AlertTriangle } from "lucide-react";
import { ComplianceForm } from "./compliance-form";

export function CryptoToFiat({ user }: { user: User }) {
  return (
    <div className="flex justify-center mx-auto w-full max-w-2xl">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80" />
        <CardContent className="pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
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
        </CardContent>
        <CardFooter className="border-t border-zinc-200/80 bg-zinc-50 rounded-b-lg p-6 items-center justify-center">
          <ComplianceForm user={user} />
        </CardFooter>
      </Card>
    </div>
  );
}
