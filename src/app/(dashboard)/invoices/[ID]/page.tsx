import { PageDescription, PageTitle } from "@/components/page-elements";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import { formatDate } from "@/lib/date-utils";
import { api } from "@/trpc/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentSection } from "./_components/payment-section";
import { getInvoice } from "./helpers";
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
  await requireAuth();
  const invoice = await getInvoice(params.ID);

  if (!invoice) {
    notFound();
  }

  const paymentDetailsData = invoice.paymentDetailsId
    ? await api.compliance.getPaymentDetailsById.query(invoice.paymentDetailsId)
    : null;

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <PageTitle>Invoice Payment</PageTitle>
      </div>
      <PageDescription>
        Overview of your invoice payment details
      </PageDescription>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Section */}
        <PaymentSection serverInvoice={invoice} />

        {/* Invoice Preview */}
        <Card className="w-full shadow-sm border-0">
          <CardContent className="p-8">
            {/* Header Section */}
            <div className="mb-12">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    INVOICE NO
                  </div>
                  <div className="text-sm font-medium">
                    {invoice.invoiceNumber}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    ISSUED
                  </div>
                  <div className="text-sm">
                    {formatDate(invoice.issuedDate)}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    DUE DATE
                  </div>
                  <div className="text-sm">{formatDate(invoice.dueDate)}</div>
                </div>
              </div>
              {invoice.recurrence && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    RECURRING
                  </div>
                  <div className="text-sm flex items-center gap-1">
                    <span>↻ {invoice.recurrence.frequency.toLowerCase()}</span>
                    {invoice.recurrence.startDate && (
                      <span>
                        • Starting {formatDate(invoice.recurrence.startDate)}
                      </span>
                    )}
                    {invoice.isRecurrenceStopped && (
                      <Badge
                        variant="outline"
                        className="ml-1 text-xs py-0 px-1"
                      >
                        Stopped
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* From/To Section */}
            <div className="grid grid-cols-2 gap-16 mb-12">
              <div>
                <div className="text-xs text-muted-foreground mb-3">FROM</div>
                <div className="space-y-1">
                  <div className="text-sm">{invoice.creatorName}</div>
                  <div className="text-sm text-muted-foreground">
                    {invoice.creatorEmail}
                  </div>
                  <div className="text-sm mt-4">PAYABLE TO:</div>
                  <div className="text-sm text-muted-foreground font-mono break-all">
                    {invoice.payee}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-3">TO</div>
                <div className="space-y-1">
                  <div className="text-sm">{invoice.clientName}</div>
                  <div className="text-sm text-muted-foreground">
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
                    <th className="text-xs text-muted-foreground text-left pb-3">
                      DESCRIPTION
                    </th>
                    <th className="text-xs text-muted-foreground text-right pb-3">
                      QTY
                    </th>
                    <th className="text-xs text-muted-foreground text-right pb-3">
                      PRICE
                    </th>
                    <th className="text-xs text-muted-foreground text-right pb-3">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody className="border-y border-border">
                  {(invoice.items as InvoiceItem[]).map((item, index) => (
                    <tr key={`invoice-item-${item.description}-${index}`}>
                      <td className="py-3">
                        <div className="text-sm">{item.description}</div>
                      </td>
                      <td className="py-3 text-right text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {item.price.toString()}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {(item.quantity * item.price).toString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-48">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="text-sm">
                      {Number(invoice.amount).toString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-sm font-medium">Total</span>
                    <div>
                      <div className="text-sm text-right font-medium">
                        {Number(invoice.amount).toString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
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
                <div className="text-xs text-muted-foreground mb-1">
                  PAYABLE IN
                </div>
                <div className="text-sm">
                  {formatCurrencyLabel(invoice.paymentCurrency)}
                </div>
              </div>
              {paymentDetailsData?.paymentDetails ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    BANK ACCOUNT DETAILS
                  </div>
                  {paymentDetailsData.paymentDetails.accountName && (
                    <div className="text-sm">
                      {paymentDetailsData.paymentDetails.accountName}
                    </div>
                  )}
                  {paymentDetailsData.paymentDetails.accountNumber && (
                    <div className="text-sm">
                      {paymentDetailsData.paymentDetails.accountNumber.replace(
                        /^\d+(?=\d{4})/,
                        "****",
                      )}
                    </div>
                  )}
                  {paymentDetailsData.paymentDetails.bankName && (
                    <div className="text-sm">
                      {paymentDetailsData.paymentDetails.bankName}
                    </div>
                  )}
                  {paymentDetailsData.paymentDetails.swiftBic && (
                    <div className="text-sm">
                      {paymentDetailsData.paymentDetails.swiftBic}
                    </div>
                  )}
                  {paymentDetailsData.paymentDetails.iban && (
                    <div className="text-sm">
                      {paymentDetailsData.paymentDetails.iban}
                    </div>
                  )}
                  {paymentDetailsData.paymentDetails.currency && (
                    <div className="text-sm">
                      {paymentDetailsData.paymentDetails.currency.toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    BANK ACCOUNT DETAILS
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {!invoice.paymentDetailsId
                      ? "No payment details available"
                      : "Unable to load payment details"}
                  </div>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    NOTES
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words max-w-[300px]">
                    {invoice.notes}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
