import { PaymentSecuredUsingRequest } from "@/components/payment-secured-using-request";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { LogOut, Plus } from "lucide-react";

export function CreateRecurringPaymentForm() {
  const { address } = useAppKitAccount();
  const { open } = useAppKit();

  return (
    <form className="space-y-4">
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <p className="text-zinc-600 text-center max-w-md">
          Recurring payment form will be implemented here
        </p>
      </div>
      <PaymentSecuredUsingRequest />
      <CardFooter className="flex justify-between items-center pt-2 pb-6 px-0">
        <button
          type="button"
          onClick={() => open()}
          className="flex items-center text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <span className="font-mono mr-2">
            {address?.substring(0, 6)}...
            {address?.substring(address?.length - 4)}
          </span>
          <LogOut className="h-3 w-3" />
        </button>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Create Recurring Payment
        </Button>
      </CardFooter>
    </form>
  );
}
