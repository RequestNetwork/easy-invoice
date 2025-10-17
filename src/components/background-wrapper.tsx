"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface BackgroundWrapperProps {
  children: ReactNode;
  topGradient?: {
    from: string;
    to: string;
  };
  bottomGradient?: {
    from: string;
    to: string;
  };
}

export function BackgroundWrapper({
  children,
  topGradient = {
    from: "orange-100",
    to: "orange-200",
  },
  bottomGradient = {
    from: "zinc-100",
    to: "zinc-200",
  },
}: BackgroundWrapperProps) {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getTailwindColor = (colorName: string): string => {
    const colors: Record<string, string> = {
      "orange-100": "#ffedd5",
      "orange-200": "#fed7aa",
      "blue-100": "#dbeafe",
      "blue-200": "#bfdbfe",
      "indigo-100": "#e0e7ff",
      "indigo-200": "#c7d2fe",
      "zinc-100": "#f4f4f5",
      "zinc-200": "#e4e4e7",
      "zinc-800": "#27272a",
      "zinc-900": "#18181b",
      "slate-800": "#1e293b",
      "slate-900": "#0f172a",
    };

    return colors[colorName] || "#f4f4f5";
  };

  const isDark = isMounted && resolvedTheme === "dark";

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Decorative elements - offset for sidebar */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2"
        style={{ display: isMounted && !isDark ? "block" : "none" }}
      >
        <div
          className="w-full h-full rounded-full opacity-30 blur-3xl"
          style={{
            background: `linear-gradient(to bottom right, ${getTailwindColor(topGradient.from)}, ${getTailwindColor(topGradient.to)})`,
          }}
        />
      </div>
      <div
        className="absolute bottom-0 left-64 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2"
        style={{ display: isMounted && !isDark ? "block" : "none" }}
      >
        <div
          className="w-full h-full rounded-full opacity-30 blur-3xl"
          style={{
            background: `linear-gradient(to top right, ${getTailwindColor(bottomGradient.from)}, ${getTailwindColor(bottomGradient.to)})`,
          }}
        />
      </div>

      {/* Dot pattern background - offset for sidebar */}
      <div
        className="absolute inset-0 left-64"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--muted)) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
