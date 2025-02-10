import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceFormValues } from "@/lib/schemas/invoice";

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Invoice Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold mb-2">
            Invoice #{data.invoiceNumber || "---"}
          </h2>
          <p>Due Date: {data.dueDate || "---"}</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Bill To:</h3>
          <p>{data.clientName || "---"}</p>
          <p>{data.clientEmail || "---"}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Items:</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Description</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(data.items || []).map((item, index) => (
                <tr
                  key={`invoice-item-${item.description}-${index}`}
                  className="border-b"
                >
                  <td className="py-2">{item.description || "---"}</td>
                  <td className="text-right py-2">{item.quantity || 0}</td>
                  <td className="text-right py-2">
                    {(item.price || 0).toFixed(2)}{" "}
                    {data.cryptocurrency?.toUpperCase() || "---"}
                  </td>
                  <td className="text-right py-2">
                    {((item.quantity || 0) * (item.price || 0)).toFixed(2)}{" "}
                    {data.cryptocurrency?.toUpperCase() || "---"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-semibold pt-4">
                  Total:
                </td>
                <td className="text-right font-bold pt-4">
                  {calculateTotal().toFixed(2)}{" "}
                  {data.cryptocurrency?.toUpperCase() || "---"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Payment Details:</h3>
          <p>Cryptocurrency: {data.cryptocurrency || "---"}</p>
          <p>Your Wallet: {data.walletAddress || "---"}</p>
          <p>Client's Wallet: {data.clientWallet || "---"}</p>
        </div>
        {data.notes && (
          <div className="space-y-2">
            <h3 className="font-semibold">Notes:</h3>
            <p>{data.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
