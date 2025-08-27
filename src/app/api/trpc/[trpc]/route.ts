import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import type { NextRequest } from "next/server";

import { appRouter } from "@/server/index";
import { createTRPCContext } from "@/server/trpc";

// Create automatic mapping from TRPC error codes to HTTP status codes
const TRPC_TO_HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500,
} as const;

function getHttpStatusFromTrpcError(errorCode: number | string): number {
  if (typeof errorCode === "string" && errorCode in TRPC_TO_HTTP_STATUS) {
    return TRPC_TO_HTTP_STATUS[errorCode as keyof typeof TRPC_TO_HTTP_STATUS];
  }

  if (typeof errorCode === "number") {
    for (const [trpcCode, jsonRpcCode] of Object.entries(
      TRPC_ERROR_CODES_BY_KEY,
    )) {
      if (jsonRpcCode === errorCode && trpcCode in TRPC_TO_HTTP_STATUS) {
        return TRPC_TO_HTTP_STATUS[
          trpcCode as keyof typeof TRPC_TO_HTTP_STATUS
        ];
      }
    }
  }

  return 500;
}

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    // @ts-expect-error: This works , no need to fix
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
    responseMeta({ errors }) {
      if (errors.length > 0) {
        const firstError = errors[0];
        const httpStatus = getHttpStatusFromTrpcError(firstError.code);
        return { status: httpStatus };
      }

      return { status: 200 };
    },
  });

export { handler as GET, handler as POST };
