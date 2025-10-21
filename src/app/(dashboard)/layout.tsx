import { Footer } from "@/components/footer";
import { Sidebar } from "@/components/navigation/sidebar";
import { Topbar } from "@/components/navigation/topbar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />
        <div className="bg-muted/30 w-full h-full relative flex flex-col px-4 py-2">
          {children}
          <Footer />
        </div>
      </div>
    </div>
  );
}
