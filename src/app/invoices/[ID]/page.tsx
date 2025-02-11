import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PaymentSection } from "@/components/payment-section";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { formatCurrencyLabel } from "@/lib/currencies";

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
						<Card className="w-full">
							<CardHeader>
								<CardTitle>Invoice Preview</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="border-b pb-4">
									<h2 className="text-2xl font-bold mb-2">
										Invoice #{invoice.invoiceNumber}
									</h2>
									<p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
								</div>
								<div className="space-y-2">
									<h3 className="font-semibold">Bill To:</h3>
									<p>{invoice.clientName}</p>
									<p>{invoice.clientEmail}</p>
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
											{(invoice.items as InvoiceItem[]).map((item, index) => (
												<tr key={index} className="border-b">
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
													${Number(invoice.amount).toFixed(2)}
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
								<div className="space-y-2">
									<h3 className="font-semibold">Payment Details:</h3>
									<p>Invoice Currency: {formatCurrencyLabel(invoice.invoiceCurrency)}</p>
									<p>Payment Currency: {formatCurrencyLabel(invoice.paymentCurrency)}</p>
									<p>Recipient Wallet: {invoice.payee}</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		</div>
	);
}
