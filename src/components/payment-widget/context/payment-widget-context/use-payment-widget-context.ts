import { useContext } from "react";
import { type PaymentWidgetContextValue, PaymentWidgetContext } from "./index";

export function usePaymentWidgetContext(): PaymentWidgetContextValue {
  const context = useContext(PaymentWidgetContext);

  if (!context) {
    throw new Error(
      "usePaymentWidgetContext must be used within a PaymentWidgetProvider",
    );
  }

  return context;
}
