import { invoiceFormSchema } from "@/lib/schemas/invoice";

import { protectedProcedure, router } from "../trpc";

export const invoiceRouter = router({
  create: protectedProcedure.input(invoiceFormSchema).mutation(async () => {
    try {
      return { success: true };
    } catch (error) {
      console.log("Error: ", error);
      return { success: false };
    }
  }),
});
