"use client";

import type { SessionValidationResult } from "@/server/auth";
import type { User } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { type ReactNode, createContext, useContext } from "react";

type AuthContextType =
  | {
      isAuthenticated: true;
      user: User;
      isLoading: false;
    }
  | {
      isAuthenticated: false;
      user: null;
      isLoading: false;
    }
  | {
      isAuthenticated: false;
      user: null;
      isLoading: true;
    };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: SessionValidationResult | null;
}) {
  const { data, isLoading } = api.auth.getSessionInfo.useQuery(undefined, {
    enabled: !initialSession,
    refetchOnWindowFocus: false,
    initialData: initialSession ?? undefined,
  });

  const contextValue: AuthContextType = isLoading
    ? { isAuthenticated: false, user: null, isLoading: true }
    : data?.user
      ? { isAuthenticated: true, user: data.user, isLoading: false }
      : { isAuthenticated: false, user: null, isLoading: false };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
