import { isNotFoundError } from "@/lib/utils";
import { api } from "@/trpc/server";

export async function getInvoice(id: string) {
  try {
    return await api.invoice.getById.query(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
