"use client";

import { useAuthContext } from "@/context/auth";
import { ModeToggle } from "../mode-toggle";
import { UserMenu } from "../user-menu";

import { FaucetTokens } from "../faucet";

export function Topbar() {
  const auth = useAuthContext();

  if (!auth.isAuthenticated) {
    return (
      <div className="flex flex-row h-16 w-full items-center justify-end px-4 border-b bg-background">
        <ModeToggle />
      </div>
    );
  }

  return (
    <div className="flex flex-row h-16 w-full items-center justify-between px-4 border-b bg-background">
      <div className="flex items-center gap-2 ml-auto">
        <FaucetTokens />
        <UserMenu user={auth.user} />
        <ModeToggle />
      </div>
    </div>
  );
}
