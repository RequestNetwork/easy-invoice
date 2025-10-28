import type { ReactNode } from "react";

interface PageTitleProps {
  className?: string;
  children: ReactNode;
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1
      className={`text-4xl font-bold tracking-tight text-foreground ${className}`}
    >
      {children}
    </h1>
  );
}

interface PageDescriptionProps {
  children: ReactNode;
}

export function PageDescription({ children }: PageDescriptionProps) {
  return (
    <p className="mt-2 mb-4 text-base text-muted-foreground">{children}</p>
  );
}
