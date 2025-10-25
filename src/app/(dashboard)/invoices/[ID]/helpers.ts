import { isNotFoundError } from "@/lib/helpers";
import { api } from "@/trpc/server";

export async function getInvoice(id: string) {
  try {
    return await api.invoice.getById(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
