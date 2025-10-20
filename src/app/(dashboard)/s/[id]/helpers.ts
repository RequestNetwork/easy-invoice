import { isNotFoundError } from "@/lib/utils";
import { api } from "@/trpc/server";

export async function getSubscriptionPlan(id: string) {
  try {
    return await api.subscriptionPlan.getById.query(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error; // Re-throw unexpected errors
  }
}
