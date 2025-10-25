import { isNotFoundError } from "@/lib/helpers";
import { api } from "@/trpc/server";

export async function getSubscriptionPlan(id: string) {
  try {
    return await api.subscriptionPlan.getById(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error; // Re-throw unexpected errors
  }
}
