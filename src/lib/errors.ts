import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { isAxiosError } from "axios";

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

function mapStatusCodeToTRPCCode(statusCode: number): TRPC_ERROR_CODE_KEY {
  if (statusCode >= 400 && statusCode < 500) {
    switch (statusCode) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "UNPROCESSABLE_CONTENT";
      case 429:
        return "TOO_MANY_REQUESTS";
      default:
        return "BAD_REQUEST";
    }
  }

  return "INTERNAL_SERVER_ERROR";
}

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (isAxiosError(error)) {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    const code = mapStatusCodeToTRPCCode(statusCode);
    return new TRPCError({ code, message, cause: error });
  }

  if (error instanceof ResourceNotFoundError) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  // Handle regular Error objects with custom status codes
  if (error instanceof Error) {
    const errorWithStatus = error as Error & {
      status?: number;
      statusCode?: number;
    };
    const statusCode = errorWithStatus.status || errorWithStatus.statusCode;

    if (statusCode) {
      const code = mapStatusCodeToTRPCCode(statusCode);
      return new TRPCError({ code, message: error.message, cause: error });
    }
  }

  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
    cause: error,
  });
}
