import { isNotFoundError } from "@/lib/utils";
import { api } from "@/trpc/server";

export async function getInvoiceMeLink(id: string) {
  try {
    return await api.invoiceMe.getById.query(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
