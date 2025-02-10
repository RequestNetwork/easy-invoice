import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DollarSign, FileText, AlertCircle, PlusCircle } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

// Mock data for demonstration - In real app, this would come from your database
const mockInvoices = [
	{ id: "INV-001", dueDate: "2024-12-01", amount: 1500, status: "Paid" },
	{ id: "INV-002", dueDate: "2024-12-15", amount: 2000, status: "Pending" },
	{ id: "INV-003", dueDate: "2024-11-30", amount: 1000, status: "Overdue" },
	{ id: "INV-004", dueDate: "2024-12-31", amount: 3000, status: "Pending" },
];

export default async function DashboardPage() {
	const { user } = await getCurrentSession();

	if (!user) {
		redirect("/");
	}

	const totalInvoices = mockInvoices.length;
	const outstandingInvoices = mockInvoices.filter(
		(inv) => inv.status !== "Paid",
	).length;
	const totalPayments = mockInvoices.reduce(
		(sum, inv) => (inv.status === "Paid" ? sum + inv.amount : sum),
		0,
	);

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
						<Button
							asChild
							className="bg-black hover:bg-zinc-800 text-white transition-colors"
						>
							<Link href="/invoices/create">
								<PlusCircle className="mr-2 h-4 w-4" />
								Create Invoice
							</Link>
						</Button>
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
							<CardTitle>Recent Invoices</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Invoice ID</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockInvoices.map((invoice) => (
										<TableRow key={invoice.id}>
											<TableCell className="font-medium">
												{invoice.id}
											</TableCell>
											<TableCell>{invoice.dueDate}</TableCell>
											<TableCell>${invoice.amount.toLocaleString()}</TableCell>
											<TableCell>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${
														invoice.status === "Paid"
															? "bg-green-100 text-green-800"
															: invoice.status === "Pending"
															  ? "bg-yellow-100 text-yellow-800"
															  : "bg-red-100 text-red-800"
													}`}
												>
													{invoice.status}
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</main>
			</div>
		</div>
	);
}
