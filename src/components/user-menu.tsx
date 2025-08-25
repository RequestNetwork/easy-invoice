"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncateEmail } from "@/lib/utils";
import type { User } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { CopyIcon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  user: Pick<User, "name" | "id" | "email">;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const logout = api.auth.logout.useMutation({
    onSuccess: () => {
      router.replace("/");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-neutral-200 bg-background"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full">
            <span className="text-sm font-medium text-foreground">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">
              {user.name ?? "User"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-row items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {truncateEmail(user.email ?? "")}
            </p>
            <Button
              variant="ghost"
              className="size-8"
              aria-label="Copy email"
              onClick={async () => {
                await navigator.clipboard.writeText(user.email ?? "");
              }}
            >
              <CopyIcon className="size-4" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
