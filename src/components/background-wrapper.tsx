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
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FAFAFA]">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2">
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br from-${topGradient.from} to-${topGradient.to} opacity-30 blur-3xl`}
        />
      </div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2">
        <div
          className={`w-full h-full rounded-full bg-gradient-to-tr from-${bottomGradient.from} to-${bottomGradient.to} opacity-30 blur-3xl`}
        />
      </div>

      {/* Dot pattern background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e5e5e5 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
