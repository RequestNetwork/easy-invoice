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
