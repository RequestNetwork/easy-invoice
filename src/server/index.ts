import { authRouter } from "./routers/auth";
import { complianceRouter } from "./routers/compliance";
import { invoiceRouter } from "./routers/invoice";
import { invoiceMeRouter } from "./routers/invoice-me";
import { paymentRouter } from "./routers/payment";
import { recurringPaymentRouter } from "./routers/recurring-payment";
import { subscriptionPlanRouter } from "./routers/subscription-plan";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  invoice: invoiceRouter,
  invoiceMe: invoiceMeRouter,
  payment: paymentRouter,
  compliance: complianceRouter,
  recurringPayment: recurringPaymentRouter,
  subscriptionPlan: subscriptionPlanRouter,
});

export type AppRouter = typeof appRouter;
