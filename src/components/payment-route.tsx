import { Tooltip } from "@/components/ui/tooltip";
import type { PaymentRoute as PaymentRouteType } from "@/lib/types";
import { ArrowRight, Globe, Info, Zap } from "lucide-react";
import Image from "next/image";

interface RouteTypeInfo {
  type: "direct" | "same-chain-erc20" | "crosschain" | "crypto-to-fiat";
  label: string;
  description: string;
}

interface PaymentRouteProps {
  route: PaymentRouteType;
  isSelected: boolean;
  onClick?: () => void;
  variant?: "default" | "selected";
  routeType?: RouteTypeInfo;
  platformFee?: {
    percentage: number;
    address: string;
  };
}

export function PaymentRoute({
  route,
  isSelected,
  onClick,
  variant = "default",
  routeType,
}: PaymentRouteProps) {
  const isDirectPayment =
    routeType?.type === "direct" ||
    (route.id === "REQUEST_NETWORK_PAYMENT" && !route.isCryptoToFiat);
  const isGasFreePayment = routeType?.type === "same-chain-erc20";
  const isCryptoToFiat = routeType?.type === "crypto-to-fiat";

  const nativeToken = route.chain === "POLYGON" ? "POL" : "ETH";

  // Get the appropriate badge color and icon based on route type
  const getBadgeStyles = () => {
    if (isCryptoToFiat) {
      return {
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
        icon: <ArrowRight className="w-3 h-3 mr-1" />,
      };
    }

    if (isDirectPayment) {
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        icon: <ArrowRight className="w-3 h-3 mr-1" />,
      };
    }

    if (isGasFreePayment) {
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        icon: <Zap className="w-3 h-3 mr-1" />,
      };
    }

    return {
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      icon: <Globe className="w-3 h-3 mr-1" />,
    };
  };

  const { bgColor, textColor, icon } = getBadgeStyles();

  // Format fee breakdown for tooltip
  const formatFeeBreakdown = () => {
    if (!route.feeBreakdown || route.feeBreakdown.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2 max-w-xs">
        <div className="font-medium text-white">Fee Breakdown</div>
        {route.feeBreakdown.map((fee) => (
          <div
            key={`${fee.type}-${fee.provider}-${fee.stage}`}
            className="flex justify-between items-start text-xs"
          >
            <div className="flex-1">
              <div className="capitalize font-medium">
                {fee.type === "gas"
                  ? "Gas Fee"
                  : fee.type === "crosschain"
                    ? "Crosschain Fee"
                    : "Platform Fee"}
              </div>
            </div>
            <div className="text-right ml-2">
              <div className="font-medium">
                {fee.amount} {fee.currency}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
              src={`/${route.chain.toLowerCase()}-logo.png`}
              alt={`${route.chain} logo`}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="text-left">
            <div className="font-medium flex items-center gap-2">
              <span>
                {route.chain} {route.token}
              </span>
              <span
                className={`text-xs ${bgColor} ${textColor} px-2 py-0.5 rounded-full flex items-center`}
              >
                {icon}
                {routeType?.label ||
                  (isDirectPayment ? "Direct Payment" : "via Paygrid")}
              </span>
            </div>
            <div className="text-sm text-zinc-600">
              {routeType?.description || `via ${route.token}`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {route.fee === 0 ? (
              "No fee"
            ) : (
              <div className="flex items-center gap-1 justify-end">
                <span className="text-amber-700">
                  {route.fee} {isDirectPayment ? nativeToken : route.token} fee
                </span>
                {route.feeBreakdown && route.feeBreakdown.length > 0 && (
                  <Tooltip
                    tooltipTrigger={
                      <button
                        type="button"
                        aria-label="Show fee breakdown"
                        className="text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-3 h-3" aria-hidden="true" />
                      </button>
                    }
                    tooltipContent={formatFeeBreakdown()}
                  />
                )}
              </div>
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
