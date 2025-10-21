import { PageDescription, PageTitle } from "@/components/page-elements";
import { RecurringPaymentsNavigation } from "./_components/recurring-payments-navigation";

export default function RecurringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageTitle>Recurring Payments</PageTitle>
      <PageDescription>
        Manage and create your recurring payments
      </PageDescription>
      <RecurringPaymentsNavigation />
      <div className="mt-8">{children}</div>
    </>
  );
}
