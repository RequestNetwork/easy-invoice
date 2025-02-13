import { PaymentSection } from "@/components/payment-section";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyLabel } from "@/lib/currencies";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Invoice Payment | EasyInvoice",
  description: "Process payment for your invoice",
};

type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

export default async function PaymentPage({
  params,
}: {
  params: { ID: string };
}) {
  const invoice = await api.invoice.getById.query(params.ID);

  if (!invoice) {
    notFound();
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-green-100 to-green-200 opacity-30 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 opacity-30 blur-3xl" />
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
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6 z-10">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-x-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <span className="text-white font-bold">EI</span>
              </div>
              <span className="text-xl font-semibold">EasyInvoice</span>
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <div className="flex items-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Invoice Payment
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Section */}
            <PaymentSection invoice={invoice} />

            {/* Invoice Preview */}
            <Card className="w-full bg-white shadow-sm border-0">
              <CardContent className="p-8">
                {/* Header Section */}
                <div className="mb-12">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                      <div className="text-xs text-neutral-500 mb-1">
                        INVOICE NO
                      </div>
                      <div className="text-sm font-medium">
                        {invoice.invoiceNumber}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="text-xs text-neutral-500 mb-1">
                        ISSUED
                      </div>
                      <div className="text-sm">
                        {formatDate(invoice.issuedDate)}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="text-xs text-neutral-500 mb-1">
                        DUE DATE
                      </div>
                      <div className="text-sm">
                        {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* From/To Section */}
                <div className="grid grid-cols-2 gap-16 mb-12">
                  <div>
                    <div className="text-xs text-neutral-500 mb-3">FROM</div>
                    <div className="space-y-1">
                      <div className="text-sm">{invoice.creatorName}</div>
                      <div className="text-sm text-neutral-600">
                        {invoice.creatorEmail}
                      </div>
                      <div className="text-sm mt-4">PAYABLE TO:</div>
                      <div className="text-sm text-neutral-600 font-mono break-all">
                        {invoice.payee}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-3">TO</div>
                    <div className="space-y-1">
                      <div className="text-sm">{invoice.clientName}</div>
                      <div className="text-sm text-neutral-600">
                        {invoice.clientEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-xs text-neutral-500 text-left pb-3">
                          DESCRIPTION
                        </th>
                        <th className="text-xs text-neutral-500 text-right pb-3">
                          QTY
                        </th>
                        <th className="text-xs text-neutral-500 text-right pb-3">
                          PRICE
                        </th>
                        <th className="text-xs text-neutral-500 text-right pb-3">
                          AMOUNT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="border-y border-neutral-200">
                      {(invoice.items as InvoiceItem[]).map((item, index) => (
                        <tr key={`invoice-item-${item.description}-${index}`}>
                          <td className="py-3">
                            <div className="text-sm">{item.description}</div>
                          </td>
                          <td className="py-3 text-right text-sm">
                            {item.quantity}
                          </td>
                          <td className="py-3 text-right text-sm">
                            {item.price.toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-sm">
                            {(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mt-6">
                    <div className="w-48">
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-neutral-600">
                          Subtotal
                        </span>
                        <span className="text-sm">
                          {Number(invoice.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-neutral-200">
                        <span className="text-sm font-medium">Total</span>
                        <div>
                          <div className="text-sm text-right font-medium">
                            {Number(invoice.amount).toFixed(2)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatCurrencyLabel(invoice.invoiceCurrency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details and Notes Section */}
                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">
                      PAYABLE IN
                    </div>
                    <div className="text-sm">
                      {formatCurrencyLabel(invoice.paymentCurrency)}
                    </div>
                  </div>
                  {invoice.notes && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">NOTES</div>
                      <div className="text-sm text-neutral-600 whitespace-pre-wrap break-words max-w-[300px]">
                        {invoice.notes}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
