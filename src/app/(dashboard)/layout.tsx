import { BackgroundWrapper } from "@/components/background-wrapper";
import { Sidebar } from "@/components/navigation/sidebar";
import { Topbar } from "@/components/navigation/topbar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <BackgroundWrapper>{children}</BackgroundWrapper>
      </div>
    </div>
  );
}
