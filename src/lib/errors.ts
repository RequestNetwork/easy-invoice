import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { AxiosError } from "axios";

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;

    const code: TRPC_ERROR_CODE_KEY =
      statusCode >= 400 && statusCode < 500
        ? statusCode === 400
          ? "BAD_REQUEST"
          : statusCode === 401
            ? "UNAUTHORIZED"
            : statusCode === 403
              ? "FORBIDDEN"
              : statusCode === 404
                ? "NOT_FOUND"
                : statusCode === 409
                  ? "CONFLICT"
                  : statusCode === 422
                    ? "UNPROCESSABLE_CONTENT"
                    : statusCode === 429
                      ? "TOO_MANY_REQUESTS"
                      : "BAD_REQUEST"
        : "INTERNAL_SERVER_ERROR";

    return new TRPCError({ code, message, cause: error });
  }

  if (error instanceof ResourceNotFoundError) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
    cause: error,
  });
}
