"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock data for demonstration
const invoiceData = {
  id: "INV-001",
  amount: 1500,
  dueDate: "2024-12-31",
  status: "Pending",
  clientName: "John Doe",
  clientEmail: "john@example.com",
  items: [
    { description: "Web Development", quantity: 1, price: 1000 },
    { description: "UI/UX Design", quantity: 1, price: 500 },
  ],
  paymentMethod: "crypto",
  cryptocurrency: "ETH",
  walletAddress: "0x1234...5678",
};

export default function PaymentPage() {
  const [paymentStatus, setPaymentStatus] = useState(invoiceData.status);
  const [connectedWallet, setConnectedWallet] = useState("");

  const handleConnectWallet = () => {
    // Simulating wallet connection
    setConnectedWallet("0xABCD...EFGH");
  };

  const handlePayment = () => {
    // Simulating payment process
    setPaymentStatus("Processing");
    setTimeout(() => {
      setPaymentStatus("Paid");
    }, 2000);
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
                <span className="text-white font-bold">IP</span>
              </div>
              <span className="text-xl font-semibold">EasyInvoice</span>
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <div className="flex items-center mb-8">
            <Link
              href="/dashboard"
              className="text-zinc-600 hover:text-black transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">
              Invoice Payment
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Payment Details</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      paymentStatus === "Paid"
                        ? "bg-green-100 text-green-800"
                        : paymentStatus === "Processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {paymentStatus === "Paid" && (
                      <CheckCircle className="inline-block w-4 h-4 mr-1" />
                    )}
                    {paymentStatus === "Processing" && (
                      <Clock className="inline-block w-4 h-4 mr-1" />
                    )}
                    {paymentStatus === "Pending" && (
                      <Clock className="inline-block w-4 h-4 mr-1" />
                    )}
                    {paymentStatus}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Secure Payment
                  </h3>
                  <p className="text-sm text-green-700">
                    This payment is secured using blockchain technology. Your
                    transaction will be processed safely and transparently.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Amount Due</Label>
                  <div className="text-3xl font-bold">
                    ${invoiceData.amount.toFixed(2)}{" "}
                    {invoiceData.cryptocurrency}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Recipient Address</Label>
                  <div className="font-mono bg-zinc-100 p-2 rounded">
                    {invoiceData.walletAddress}
                  </div>
                </div>

                <Tabs defaultValue="wallet">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wallet">Connect Wallet</TabsTrigger>
                    <TabsTrigger value="manual">Manual Transfer</TabsTrigger>
                  </TabsList>
                  <TabsContent value="wallet" className="space-y-4">
                    {connectedWallet ? (
                      <div className="space-y-2">
                        <Label>Connected Wallet</Label>
                        <div className="font-mono bg-zinc-100 p-2 rounded">
                          {connectedWallet}
                        </div>
                      </div>
                    ) : (
                      <Button onClick={handleConnectWallet} className="w-full">
                        Connect Wallet
                      </Button>
                    )}
                    {connectedWallet && (
                      <Button
                        onClick={handlePayment}
                        className="w-full bg-black hover:bg-zinc-800 text-white"
                      >
                        Pay Now
                      </Button>
                    )}
                  </TabsContent>
                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Transfer Instructions</Label>
                      <p className="text-sm text-zinc-600">
                        Please send the exact amount of{" "}
                        {invoiceData.amount.toFixed(2)}{" "}
                        {invoiceData.cryptocurrency} to the recipient address
                        above. Once the transaction is confirmed on the
                        blockchain, your payment will be marked as complete.
                      </p>
                    </div>
                    <Button
                      onClick={handlePayment}
                      className="w-full bg-black hover:bg-zinc-800 text-white"
                    >
                      I've Sent the Payment
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Invoice Preview */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Invoice Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    Invoice #{invoiceData.id}
                  </h2>
                  <p>Due Date: {invoiceData.dueDate}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Bill To:</h3>
                  <p>{invoiceData.clientName}</p>
                  <p>{invoiceData.clientEmail}</p>
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
                      {invoiceData.items.map((item, index) => (
                        <tr
                          key={`invoice-item-${item.description}-${index}`}
                          className="border-b"
                        >
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="text-right py-2">
                            ${(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan={3}
                          className="text-right font-semibold pt-4"
                        >
                          Total:
                        </td>
                        <td className="text-right font-bold pt-4">
                          ${invoiceData.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Payment Details:</h3>
                  <p>Cryptocurrency: {invoiceData.cryptocurrency}</p>
                  <p>Recipient Wallet: {invoiceData.walletAddress}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
