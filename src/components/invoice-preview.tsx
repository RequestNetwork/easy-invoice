import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyLabel } from "@/lib/currencies";
import type { InvoiceFormValues } from "@/lib/schemas/invoice";

interface InvoicePreviewProps {
  data: Partial<InvoiceFormValues>;
}

export function InvoicePreview({ data }: InvoicePreviewProps) {
  const calculateTotal = () => {
    return (data.items || []).reduce(
      (total, item) => total + (item.quantity || 0) * (item.price || 0),
      0,
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Card className="w-full bg-white shadow-sm border-0">
      <CardContent className="p-8 min-h-[842px]">
        {/* Header Section */}
        <div className="mb-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <div className="text-xs text-neutral-500 mb-1">INVOICE NO</div>
              <div className="text-sm font-medium">
                {data.invoiceNumber || "INV-001"}
              </div>
            </div>
            <div className="col-span-4">
              <div className="text-xs text-neutral-500 mb-1">ISSUED</div>
              <div className="text-sm">
                {formatDate(new Date().toISOString())}
              </div>
            </div>
            <div className="col-span-4">
              <div className="text-xs text-neutral-500 mb-1">DUE DATE</div>
              <div className="text-sm">
                {data.dueDate ? formatDate(data.dueDate) : "MM/DD/YY"}
              </div>
            </div>
          </div>
        </div>

        {/* From/To Section */}
        <div className="grid grid-cols-2 gap-16 mb-12">
          <div>
            <div className="text-xs text-neutral-500 mb-3">FROM</div>
            <div className="space-y-1">
              <div className="text-sm">PAYABLE TO:</div>
              <div className="text-sm text-neutral-600 font-mono break-all">
                {data.walletAddress || "Payee address"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-3">TO</div>
            <div className="space-y-1">
              <div className="text-sm">{data.clientName || "Client name"}</div>
              <div className="text-sm text-neutral-600">
                {data.clientEmail || "client@email.com"}
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
              {(
                data.items || [
                  { description: "Description", quantity: 1, price: 0 },
                ]
              ).map((item, index) => (
                <tr key={`invoice-item-${item.description}-${index}`}>
                  <td className="py-3">
                    <div className="text-sm">{item.description}</div>
                  </td>
                  <td className="py-3 text-right text-sm">{item.quantity}</td>
                  <td className="py-3 text-right text-sm">
                    {(item.price || 0).toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-sm">
                    {((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-48">
              <div className="flex justify-between py-2">
                <span className="text-sm text-neutral-600">Subtotal</span>
                <span className="text-sm">{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <span className="text-sm font-medium">Total</span>
                <div>
                  <div className="text-sm text-right font-medium">
                    {calculateTotal().toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {formatCurrencyLabel(data.invoiceCurrency || "USD")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details and Notes Section */}
        <div className="grid grid-cols-2 gap-16">
          <div>
            <div className="text-xs text-neutral-500 mb-1">PAYABLE IN</div>
            <div className="text-sm">
              {!data.paymentCurrency
                ? "Choose payment currency"
                : formatCurrencyLabel(
                    data.paymentCurrency ||
                      data.invoiceCurrency ||
                      "Select currency",
                  )}
            </div>
          </div>
          {data.notes && (
            <div>
              <div className="text-xs text-neutral-500 mb-1">NOTES</div>
              <div className="text-sm text-neutral-600 whitespace-pre-wrap break-words max-w-[300px]">
                {data.notes}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
