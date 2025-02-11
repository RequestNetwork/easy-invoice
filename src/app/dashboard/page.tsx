import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { UserMenu } from "@/components/user-menu";
import { getCurrentSession } from "@/server/auth";
import { api } from "@/trpc/server";
import {
	AlertCircle,
	DollarSign,
	Eye,
	FileText,
	PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format, isPast } from "date-fns";

export default async function DashboardPage() {
	const { user } = await getCurrentSession();

	const { invoices, totalPayments, outstandingInvoices } =
		await api.invoice.getAll.query();

	if (!user) {
		redirect("/");
	}

	const totalInvoices = invoices.length;

	return (
		<div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2">
				<div className="w-full h-full rounded-full bg-gradient-to-br from-orange-100 to-orange-200 opacity-30 blur-3xl" />
			</div>
			<div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/2 -translate-x-1/2">
				<div className="w-full h-full rounded-full bg-gradient-to-tr from-zinc-100 to-zinc-200 opacity-30 blur-3xl" />
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
				<header className="w-full p-6 z-50 relative">
					<nav className="max-w-7xl mx-auto flex justify-between items-center">
						<div className="flex items-center gap-x-2">
							<div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
								<span className="text-white font-bold">EI</span>
							</div>
							<span className="text-xl font-semibold">EasyInvoice</span>
						</div>
						<div className="flex items-center space-x-4">
							<UserMenu user={user} />
						</div>
					</nav>
				</header>

				{/* Main Content */}
				<main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
					<div className="flex justify-between items-center mb-8">
						<h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>

						<Link
							href="/invoices/create"
							className="bg-black hover:bg-zinc-800 text-white transition-colors px-4 py-2 rounded-md flex items-center"
						>
							<PlusCircle className="mr-2 h-4 w-4" />
							Create Invoice
						</Link>
					</div>

					{/* Summary Section */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						<Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-orange-800">
									Total Invoices
								</CardTitle>
								<FileText className="h-4 w-4 text-orange-600" />
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-orange-900">
									{totalInvoices}
								</div>
							</CardContent>
						</Card>
						<Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-none shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-yellow-800">
									Outstanding Invoices
								</CardTitle>
								<AlertCircle className="h-4 w-4 text-yellow-600" />
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-yellow-900">
									{outstandingInvoices}
								</div>
							</CardContent>
						</Card>
						<Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-green-800">
									Total Payments
								</CardTitle>
								<DollarSign className="h-4 w-4 text-green-600" />
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900">
									${totalPayments.toLocaleString()}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Invoice List */}
					<Card className="flex-grow">
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle className="text-lg font-medium">
									Recent Invoices
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="px-6">
							{invoices.length === 0 ? (
								<div className="text-center py-12">
									<FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
									<p className="text-gray-500">Get started by creating your first invoice.</p>
									<Link
										href="/invoices/create"
										className="inline-flex items-center mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 transition-colors"
									>
										<PlusCircle className="mr-2 h-4 w-4" />
										Create Invoice
									</Link>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent border-t">
											<TableHead className="text-gray-600">Invoice #</TableHead>
											<TableHead className="text-gray-600">Client</TableHead>
											<TableHead className="text-gray-600">Amount</TableHead>
											<TableHead className="text-gray-600">Due Date</TableHead>
											<TableHead className="text-gray-600">Status</TableHead>
											<TableHead className="text-gray-600">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoices.map((invoice) => {
											const dueDate = new Date(invoice.dueDate);
											const isOverdue = invoice.status === "pending" && isPast(dueDate);
											
											return (
												<TableRow key={invoice.id} className="hover:bg-gray-50">
													<TableCell className="font-medium">
														{invoice.invoiceNumber}
													</TableCell>
													<TableCell>{invoice.clientName}</TableCell>
													<TableCell>
														{Number(invoice.amount).toLocaleString()} {invoice.currency}
													</TableCell>
													<TableCell>
														{format(dueDate, 'do MMMM yyyy')}
													</TableCell>
													<TableCell>
														<span
															className={`px-3 py-1 rounded-full text-xs font-medium ${
																invoice.status === "paid"
																	? "bg-green-100 text-green-800"
																	: isOverdue
																	? "bg-red-100 text-red-800"
																	: "bg-yellow-100 text-yellow-800"
															}`}
														>
															{isOverdue ? "Overdue" : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
														</span>
													</TableCell>
													<TableCell>
														<div className="flex gap-2">
															<Link
																href={`/invoices/${invoice.id}`}
																className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
															>
																<Eye className="h-4 w-4" />
																<span className="sr-only">View</span>
															</Link>
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</main>
			</div>
		</div>
	);
}
