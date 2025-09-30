"use client";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        className="relative h-8 w-16 rounded-full bg-muted p-0 dark:bg-muted"
        disabled
        aria-label="Loading theme toggle"
      >
        <div className="absolute left-[2px] h-7 w-7 rounded-full bg-background shadow dark:bg-background">
          <div className="flex h-full w-full items-center justify-center">
            <Sun className="h-4 w-4 text-foreground opacity-50" />
          </div>
        </div>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      className="relative h-8 w-16 rounded-full bg-muted p-0 dark:bg-muted"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      <div
        className="absolute left-[2px] h-7 w-7 rounded-full bg-background shadow dark:bg-background"
        style={{
          transform: `translateX(${isDark ? 32 : 0}px) scale(1)`,
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `rotate(${isDark ? 360 : 0}deg)`,
            transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-foreground" />
          ) : (
            <Sun className="h-4 w-4 text-foreground" />
          )}
        </div>
      </div>
    </Button>
  );
}
