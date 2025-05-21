import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import { formatDate } from "@/lib/date-utils";
import type { InvoiceFormValues } from "@/lib/schemas/invoice";
import { api } from "@/trpc/react";

interface InvoicePreviewProps {
  data: Partial<InvoiceFormValues>;
  paymentDetailsId: string | undefined;
}

export function InvoicePreview({
  data,
  paymentDetailsId,
}: InvoicePreviewProps) {
  const calculateTotal = () => {
    return (data.items || []).reduce(
      (total, item) => total + (item.quantity || 0) * (item.price || 0),
      0,
    );
  };

  const { data: selectedPaymentDetails } =
    api.compliance.getPaymentDetailsById.useQuery(
      typeof paymentDetailsId === "string" ? paymentDetailsId : "",
      {
        enabled: !!paymentDetailsId, // only fetch when we _have_ an id
      },
    );

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
          {data.isRecurring && data.frequency && (
            <div className="mt-4">
              <div className="text-xs text-neutral-500 mb-1">RECURRING</div>
              <div className="text-sm flex items-center gap-1">
                <span>↻ {data.frequency.toLowerCase()}</span>
                {data.startDate && (
                  <span>• Starting {formatDate(data.startDate)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* From/To Section */}
        <div className="grid grid-cols-2 gap-16 mb-12">
          <div className="space-y-6">
            <div>
              <div className="text-xs text-neutral-500 mb-3">FROM</div>
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {data.creatorName || "Your name"}
                </div>
                <div className="text-sm text-neutral-600">
                  {data.creatorEmail || "your@email.com"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">PAYABLE TO</div>
              <div className="text-sm text-neutral-600 font-mono break-all">
                {data.walletAddress || "Payee address"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-3">TO</div>
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {data.clientName || "Client name"}
              </div>
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
                    {(item.price || 0).toString()}
                  </td>
                  <td className="py-3 text-right text-sm">
                    {((item.quantity || 0) * (item.price || 0)).toString()}
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
                <span className="text-sm">{calculateTotal().toString()}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <span className="text-sm font-medium">Total</span>
                <div>
                  <div className="text-sm text-right font-medium">
                    {calculateTotal().toString()}
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
          <div className="space-y-6">
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

            {/* Bank Account Details */}
            {selectedPaymentDetails && (
              <div>
                <div className="text-xs text-neutral-500 mb-1">
                  BANK ACCOUNT DETAILS
                </div>
                <div className="space-y-1 text-sm">
                  {selectedPaymentDetails.paymentDetails.accountName && (
                    <p>
                      <b>Name:</b>{" "}
                      {selectedPaymentDetails.paymentDetails.accountName}
                    </p>
                  )}
                  {selectedPaymentDetails.paymentDetails.bankName && (
                    <p>
                      <b>Bank Name:</b>{" "}
                      {selectedPaymentDetails.paymentDetails.bankName}
                    </p>
                  )}
                  {selectedPaymentDetails.paymentDetails.accountNumber && (
                    <p>
                      <b>Account Number:</b>{" "}
                      {selectedPaymentDetails.paymentDetails.accountNumber.replace(
                        /^\d+(?=\d{4})/,
                        "****",
                      )}
                    </p>
                  )}
                  {selectedPaymentDetails.paymentDetails.iban && (
                    <p>
                      <b>IBAN:</b> {selectedPaymentDetails.paymentDetails.iban}
                    </p>
                  )}
                  {selectedPaymentDetails.paymentDetails.swiftBic && (
                    <p>
                      <b>SWIFT BIC:</b>{" "}
                      {selectedPaymentDetails.paymentDetails.swiftBic}
                    </p>
                  )}
                  {selectedPaymentDetails.paymentDetails.currency && (
                    <p>
                      <b>Currency:</b>{" "}
                      {selectedPaymentDetails.paymentDetails.currency.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            )}
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
