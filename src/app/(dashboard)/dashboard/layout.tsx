import { PageDescription, PageTitle } from "@/components/page-elements";
import { DashboardNavigation } from "./_components/dashboard-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <PageDescription>
        Overview of your payments, invoices, and subscriptions
      </PageDescription>
      <DashboardNavigation />
      <div className="mt-6">{children}</div>
    </>
  );
}
