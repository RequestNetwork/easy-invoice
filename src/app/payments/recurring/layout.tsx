import { RecurringPaymentsNavigation } from "./_components/recurring-payments-navigation";

export default function RecurringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <RecurringPaymentsNavigation />
      <div className="mt-8">{children}</div>
    </div>
  );
}
