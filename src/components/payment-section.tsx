"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, Wallet, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrencyLabel } from "@/lib/currencies";
import { Request } from "@/server/db/schema";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

interface PaymentSectionProps {
	invoice: NonNullable<Request>;
}

export function PaymentSection({ invoice }: PaymentSectionProps) {
	const [paymentStatus, setPaymentStatus] = useState(invoice.status);
	const [currentStep, setCurrentStep] = useState(1);
	const [isAppKitReady, setIsAppKitReady] = useState(false);

	const { open } = useAppKit();
	const { isConnected, address } = useAppKitAccount();

	useEffect(() => {
		// Simulate AppKit initialization delay
		const timer = setTimeout(() => {
			setIsAppKitReady(true);
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		setCurrentStep(isConnected ? 2 : 1);
	}, [isConnected]);

	const handleConnectWallet = () => {
		if (isAppKitReady) {
			open();
		}
	};

	const handlePayment = () => {
		setPaymentStatus("processing");
		setTimeout(() => {
			setPaymentStatus("paid");
		}, 2000);
	};

	const showCurrencyConversion =
		invoice.invoiceCurrency !== invoice.paymentCurrency;

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex justify-between items-center">
					<span>Payment Details</span>
					<span
						className={`px-3 py-1 rounded-full text-sm font-medium ${
							paymentStatus === "paid"
								? "bg-green-100 text-green-800"
								: paymentStatus === "processing"
								  ? "bg-yellow-100 text-yellow-800"
								  : "bg-blue-100 text-blue-800"
						}`}
					>
						{paymentStatus === "paid" && (
							<CheckCircle className="inline-block w-4 h-4 mr-1" />
						)}
						{paymentStatus === "processing" && (
							<Clock className="inline-block w-4 h-4 mr-1" />
						)}
						{paymentStatus === "pending" && (
							<Clock className="inline-block w-4 h-4 mr-1" />
						)}
						{paymentStatus}
					</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
					<h3 className="font-semibold text-green-800 mb-2">Secure Payment</h3>
					<p className="text-sm text-green-700">
						This payment is secured using blockchain technology. Your
						transaction will be processed safely and transparently.
					</p>
				</div>

				<div className="space-y-2">
					<Label>Amount Due</Label>
					<div className="space-y-1">
						<div className="text-3xl font-bold">
							{formatCurrencyLabel(invoice.invoiceCurrency)}{" "}
							{Number(invoice.amount).toFixed(2)}
						</div>
						{showCurrencyConversion && (
							<div className="text-sm text-zinc-600">
								Payment will be processed in{" "}
								{formatCurrencyLabel(invoice.paymentCurrency)}
								<div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
									Note: The final amount in{" "}
									{formatCurrencyLabel(invoice.paymentCurrency)} will be
									calculated at the current exchange rate when payment is
									initiated.
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<Label>Recipient Address</Label>
					<div className="font-mono bg-zinc-100 p-2 rounded">
						{invoice.payee}
					</div>
				</div>

				{/* Payment Steps */}
				<div className="space-y-8">
					{/* Step indicators */}
					<div className="flex justify-center">
						<div className="flex items-center space-x-4">
							<div
								className={`flex items-center ${
									currentStep >= 1 ? "text-black" : "text-zinc-300"
								}`}
							>
								<div
									className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${
										currentStep >= 1
											? "border-black bg-zinc-50"
											: "border-zinc-300"
									}`}
								>
									<Wallet className="w-4 h-4" />
								</div>
								<span className="ml-2 font-medium">Connect Wallet</span>
							</div>
							<div
								className={`w-16 h-0.5 ${
									currentStep >= 2 ? "bg-black" : "bg-zinc-300"
								}`}
							/>
							<div
								className={`flex items-center ${
									currentStep >= 2 ? "text-black" : "text-zinc-300"
								}`}
							>
								<div
									className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${
										currentStep >= 2
											? "border-black bg-zinc-50"
											: "border-zinc-300"
									}`}
								>
									<CheckCircle className="w-4 h-4" />
								</div>
								<span className="ml-2 font-medium">Complete Payment</span>
							</div>
						</div>
					</div>

					{/* Step Content */}
					<div className="space-y-4">
						{currentStep === 1 && (
							<div className="space-y-4">
								<p className="text-sm text-zinc-600 text-center">
									Connect your wallet to proceed with the payment
								</p>
								<Button
									onClick={handleConnectWallet}
									className="w-full"
									disabled={!isAppKitReady}
								>
									{!isAppKitReady ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Initializing...
										</>
									) : (
										"Connect Wallet"
									)}
								</Button>
							</div>
						)}

						{currentStep === 2 && (
							<div className="space-y-4">
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label>Connected Wallet</Label>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleConnectWallet}
											disabled={!isAppKitReady}
										>
											Switch Wallet
										</Button>
									</div>
									<div className="font-mono bg-zinc-100 p-2 rounded">
										{address}
									</div>
								</div>
								<p className="text-sm text-zinc-600">
									Please confirm the payment amount and recipient address before
									proceeding.
									{showCurrencyConversion &&
										` Payment will be processed in ${formatCurrencyLabel(
											invoice.paymentCurrency,
										)}.`}
								</p>
								<Button
									onClick={handlePayment}
									className="w-full bg-black hover:bg-zinc-800 text-white"
								>
									Confirm Payment
								</Button>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
