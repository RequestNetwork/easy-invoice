import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Removes undefined and null values from an object
 * @param obj The object to filter
 * @returns A new object with only the defined and non-null values
 */
export function filterDefinedValues<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null),
  ) as Partial<T>;
}

export function truncateEmail(email: string, maxLength = 20): string {
  if (email.length <= maxLength) return email;
  const [user, domain] = email.split("@");
  const keep = maxLength - domain.length - 4;
  return `${user.slice(0, keep)}...@${domain}`;
}

export const getCanCancelPayment = (status: string) => {
  return status !== "cancelled" && status !== "completed";
};

export const isNotFoundError = (error: unknown): boolean => {
  return (
    error instanceof TRPCClientError &&
    error.cause instanceof TRPCError &&
    error.cause.code === "NOT_FOUND"
  );
};

export interface RetryConfig {
  retries?: number; // number of retries (default: 3)
  delay?: number; // delay between retries in ms (default: 1000)
  backoff?: boolean; // exponential backoff (default: false)
}

export interface RetryHooks<T> {
  onError?: (error: unknown) => void | Promise<void>;
  onSuccess?: (result: T, attempt: number) => void | Promise<void>;
  onRetry?: (attempt: number) => void | Promise<void>;
}

export type RetryOptions<T> = RetryConfig & RetryHooks<T>;

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions<T> = {},
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    backoff = false,
    onError,
    onSuccess,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      if (onSuccess) await onSuccess(result, attempt);
      return result;
    } catch (err) {
      lastError = err;

      if (attempt < retries) {
        if (onRetry) await onRetry(attempt);
        const waitTime = backoff ? delay * 2 ** (attempt - 1) : delay;
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }
  }

  if (onError) await onError(lastError);

  throw lastError;
}
