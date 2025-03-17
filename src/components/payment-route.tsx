import type { PaymentRoute as PaymentRouteType } from "@/lib/types";
import Image from "next/image";

interface PaymentRouteProps {
  route: PaymentRouteType;
  isSelected: boolean;
  onClick?: () => void;
  variant?: "default" | "selected";
}

export function PaymentRoute({
  route,
  isSelected,
  onClick,
  variant = "default",
}: PaymentRouteProps) {
  const isDirectPayment = route.id === "REQUEST_NETWORK_PAYMENT";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 border rounded-lg transition-colors ${
        variant === "selected"
          ? "border-2 border-black bg-zinc-50"
          : isSelected
            ? "bg-zinc-50 border-black"
            : "bg-white hover:border-zinc-400"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <Image
              src={
                isDirectPayment
                  ? "/request-logo.png"
                  : `/${route.chain.toLowerCase()}-logo.png`
              }
              alt={isDirectPayment ? "Request Network" : `${route.chain} logo`}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="text-left">
            <div className="font-medium flex items-center gap-2">
              {route.chain}
              {isDirectPayment && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Direct Payment
                </span>
              )}
              {!isDirectPayment && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  via Paygrid
                </span>
              )}
            </div>
            <div className="text-sm text-zinc-600">via {route.token}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {route.fee === 0 ? (
              "No fee"
            ) : (
              <span className="text-amber-700">
                {route.fee} {route.token} fee
              </span>
            )}
          </div>
          <div className="text-sm text-zinc-600">
            {typeof route.speed === "number" ? `~${route.speed}s` : "Fast"}
          </div>
        </div>
      </div>
    </button>
  );
}
