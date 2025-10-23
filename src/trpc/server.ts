import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { appRouter } from "@/server";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";

const createContext = cache(async () => {
  return createTRPCContext({
    headers: new Headers({
      cookie: (await cookies()).toString(),
      "x-trpc-source": "rsc",
    }),
  });
});

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(createContext);
