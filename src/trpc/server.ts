import "server-only";
import { appRouter } from "@/server";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";
import { cookies } from "next/headers";
import { cache } from "react";

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
