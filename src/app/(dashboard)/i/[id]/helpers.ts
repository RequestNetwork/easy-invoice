import { isNotFoundError } from "@/lib/helpers";
import { api } from "@/trpc/server";

export async function getInvoiceMeLink(id: string) {
  try {
    return await api.invoiceMe.getById(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
