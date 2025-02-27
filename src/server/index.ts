import { authRouter } from "./routers/auth";
import { invoiceRouter } from "./routers/invoice";
import { invoiceMeRouter } from "./routers/invoice-me";
import { paymentRouter } from "./routers/payment";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  invoice: invoiceRouter,
  invoiceMe: invoiceMeRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
