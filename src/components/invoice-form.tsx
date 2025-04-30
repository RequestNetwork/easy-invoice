"use client";

import { BankAccountForm } from "@/components/bank-account-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INVOICE_CURRENCIES,
  type InvoiceCurrency,
  MAINNET_CURRENCIES,
  type MainnetCurrency,
  formatCurrencyLabel,
  getPaymentCurrenciesForInvoice,
} from "@/lib/currencies";
import type { InvoiceFormValues } from "@/lib/schemas/invoice";
import type {
  PaymentDetails,
  PaymentDetailsPayers,
  User,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { Plus, Terminal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

interface InvoiceFormProps {
  form: UseFormReturn<InvoiceFormValues>;
  onSubmit: (data: InvoiceFormValues) => void;
  isLoading: boolean;
  recipientDetails?: {
    clientName: string;
    clientEmail: string;
  };
}

export function InvoiceForm({
  form,
  onSubmit,
  isLoading,
  recipientDetails,
}: InvoiceFormProps) {
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [showPendingApprovalModal, setShowPendingApprovalModal] =
    useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [linkedPaymentDetails, setLinkedPaymentDetails] = useState<
    | {
        paymentDetails: PaymentDetails;
        paymentDetailsPayers: (User & PaymentDetailsPayers)[];
      }[]
    | undefined
  >(undefined);

  // Add timeout effect for bank account modal
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showBankAccountModal) {
      timeoutId = setTimeout(() => {
        setShowBankAccountModal(false);
        toast.error("Bank account approval timed out. Please try again.");
      }, 60000); // 1 minute timeout
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showBankAccountModal]);

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const clientEmail = form.watch("clientEmail");
  const cryptoToFiatAvailable = form.watch("cryptoToFiatAvailable");

  // Query to get user by email
  const { data: clientUserData, isLoading: isLoadingUser } =
    api.compliance.getUserByEmail.useQuery(
      { email: clientEmail || "" },
      { enabled: !!clientEmail },
    );

  // Query to get payment details for the client
  const { data: paymentDetailsData, refetch: refetchPaymentDetails } =
    api.compliance.getPaymentDetails.useQuery(
      { userId: clientUserData?.id ?? "" },
      {
        enabled: !!clientUserData?.id,
        // Add polling to refresh data every 30 seconds
        refetchInterval: 30000,
        // Also refetch when the window regains focus
        refetchOnWindowFocus: true,
      },
    );

  // Watch for client email changes and update payment details accordingly
  useEffect(() => {
    if (
      cryptoToFiatAvailable &&
      clientEmail &&
      paymentDetailsData?.paymentDetails &&
      clientUserData
    ) {
      if (clientUserData.isCompliant && paymentDetailsData?.paymentDetails) {
        const validPaymentDetails = paymentDetailsData.paymentDetails.filter(
          (detail) => {
            // Include if any payer matches the client email, regardless of status
            const hasMatchingPayer = detail.paymentDetailsPayers.some(
              (payer: User & PaymentDetailsPayers) => {
                return payer.email === clientEmail;
              },
            );

            // If there's a matching payer, check their compliance status
            if (hasMatchingPayer) {
              const matchingPayer = detail.paymentDetailsPayers.find(
                (payer: User & PaymentDetailsPayers) =>
                  payer.email === clientEmail,
              );
              if (matchingPayer) {
                return matchingPayer.isCompliant;
              }
            }
            return false;
          },
        );

        setLinkedPaymentDetails(validPaymentDetails);

        // Check if the selected payment details are now approved
        if (showPendingApprovalModal && form.getValues("paymentDetailsId")) {
          const selectedPaymentDetail = validPaymentDetails.find(
            (detail) =>
              detail.paymentDetails.id === form.getValues("paymentDetailsId"),
          );

          if (selectedPaymentDetail) {
            const payer = selectedPaymentDetail.paymentDetailsPayers.find(
              (p: User & PaymentDetailsPayers) => p.email === clientEmail,
            );

            if (payer && payer.status === "approved") {
              // First close the modal
              setShowPendingApprovalModal(false);
              // Then show success message
              toast.success("Payment details approved! Creating invoice...");
              // Finally submit the form
              setTimeout(() => {
                void handleFormSubmit(form.getValues());
              }, 100);
            }
          }
        }
      } else {
        setLinkedPaymentDetails([]);
      }
    }
  }, [
    clientEmail,
    cryptoToFiatAvailable,
    paymentDetailsData?.paymentDetails,
    clientUserData,
    showPendingApprovalModal,
    form,
  ]);

  const handleFormSubmit = async (data: InvoiceFormValues) => {
    // If C2F is enabled but no payment details are linked, show bank account modal
    if (data.cryptoToFiatAvailable && !data.paymentDetailsId) {
      setShowBankAccountModal(true);
      return;
    }

    // Check if payment details have approved status
    if (data.cryptoToFiatAvailable && data.paymentDetailsId) {
      const selectedPaymentDetail = linkedPaymentDetails?.find(
        (detail) => detail.paymentDetails.id === data.paymentDetailsId,
      );

      if (selectedPaymentDetail) {
        const payer = selectedPaymentDetail.paymentDetailsPayers.find(
          (p: User & PaymentDetailsPayers) => p.email === clientEmail,
        );
        if (payer) {
          if (payer.status === "pending") {
            setShowPendingApprovalModal(true);
            return;
          }
          if (payer.status !== "approved") {
            toast.error(
              "Cannot create invoice with unapproved payment details",
            );
            return;
          }
        }
      }
    }

    try {
      await onSubmit(data);
      setInvoiceCreated(true);
    } catch (_error) {
      setInvoiceCreated(false);
    }
  };

  const allowPaymentDetailsMutation =
    api.compliance.allowPaymentDetails.useMutation({
      onSuccess: () => {
        refetchPaymentDetails();
      },
      onError: (error) => {
        toast.error(`Failed to link bank account: ${error.message}`);
      },
    });

  const handleBankAccountSuccess = async (result: {
    paymentDetails: { id: string; userId: string };
  }) => {
    setShowBankAccountModal(false);

    try {
      // Link the bank account to the client
      await allowPaymentDetailsMutation.mutateAsync({
        userId: result.paymentDetails.userId,
        paymentDetailsId: result.paymentDetails.id,
        payerEmail: clientEmail,
      });

      // Update the form with the new payment details
      form.setValue("paymentDetailsId", result.paymentDetails.id);

      // Refetch payment details to update the UI
      await refetchPaymentDetails();

      toast.success("Bank account linked successfully");
    } catch (error) {
      console.error("Error linking bank account:", error);
      toast.error("Failed to link bank account to client");
    }
  };

  return (
    <>
      <Dialog
        open={showBankAccountModal}
        onOpenChange={setShowBankAccountModal}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          {clientUserData && (
            <BankAccountForm
              user={clientUserData}
              onSuccess={handleBankAccountSuccess}
              onCancel={() => setShowBankAccountModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPendingApprovalModal}
        onOpenChange={setShowPendingApprovalModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details Pending Approval</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900" />
            <p className="text-center text-zinc-600">
              The payment details you selected are currently pending approval.
              Please wait until they are approved before creating an invoice.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowPendingApprovalModal(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input {...form.register("invoiceNumber")} placeholder="INV-001" />
            {form.formState.errors.invoiceNumber && (
              <p className="text-sm text-red-500">
                {form.formState.errors.invoiceNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input {...form.register("dueDate")} type="date" />
            {form.formState.errors.dueDate && (
              <p className="text-sm text-red-500">
                {form.formState.errors.dueDate.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRecurring"
            checked={form.watch("isRecurring")}
            onCheckedChange={(checked) => {
              form.setValue("isRecurring", checked === true);
            }}
          />
          <Label htmlFor="isRecurring">Recurring Invoice</Label>
        </div>

        {form.watch("isRecurring") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input {...form.register("startDate")} type="date" />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("frequency", value as RecurringFrequency)
                }
                defaultValue={form.getValues("frequency")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.frequency && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.frequency.message}
                </p>
              )}
            </div>
          </div>
        )}

        {recipientDetails ? (
          // Show creator fields when we have recipient details (invoice-me flow)
          <>
            <div className="space-y-2">
              <Label htmlFor="creatorName">Your Name</Label>
              <Input
                {...form.register("creatorName")}
                placeholder="Enter your name"
              />
              {form.formState.errors.creatorName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.creatorName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creatorEmail">Your Email</Label>
              <Input
                {...form.register("creatorEmail")}
                type="email"
                placeholder="your@email.com"
              />
              {form.formState.errors.creatorEmail && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.creatorEmail.message}
                </p>
              )}
            </div>
          </>
        ) : (
          // Show client fields for normal invoice flow
          <>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                {...form.register("clientName")}
                placeholder="Enter client name"
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.clientName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                {...form.register("clientEmail")}
                type="email"
                placeholder="client@example.com"
              />
              {form.formState.errors.clientEmail && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.clientEmail.message}
                </p>
              )}
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Items</Label>
          <div className="grid grid-cols-[1fr,80px,96px,40px] gap-4 mb-1">
            <Label className="text-xs text-gray-500">Description</Label>
            <Label className="text-xs text-gray-500">Quantity</Label>
            <Label className="text-xs text-gray-500">Price</Label>
            <div />
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-4">
              <div className="flex-grow">
                <Input
                  {...form.register(`items.${index}.description`)}
                  placeholder="Item description"
                />
                {form.formState.errors.items?.[index]?.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.items[index]?.description?.message}
                  </p>
                )}
              </div>
              <div className="w-20">
                <Input
                  {...form.register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  placeholder="Qty"
                />
                {form.formState.errors.items?.[index]?.quantity && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.items[index]?.quantity?.message}
                  </p>
                )}
              </div>
              <div className="w-24">
                <Input
                  {...form.register(`items.${index}.price`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Price"
                />
                {form.formState.errors.items?.[index]?.price && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.items[index]?.price?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ description: "", quantity: 1, price: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            {...form.register("notes")}
            placeholder="Enter any additional notes"
          />
          {form.formState.errors.notes && (
            <p className="text-sm text-red-500">
              {form.formState.errors.notes.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceCurrency">Invoice Currency</Label>
          <Select
            onValueChange={(value) => {
              const currency = value as InvoiceCurrency;
              form.setValue("invoiceCurrency", currency);
              // If not USD, set payment currency to same as invoice currency
              if (currency !== "USD") {
                form.setValue("paymentCurrency", currency);
              }
            }}
            defaultValue={form.getValues("invoiceCurrency")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select invoice currency" />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {formatCurrencyLabel(currency)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.invoiceCurrency && (
            <p className="text-sm text-red-500">
              {form.formState.errors.invoiceCurrency.message}
            </p>
          )}
        </div>
        {MAINNET_CURRENCIES.includes(
          form.watch("invoiceCurrency") as MainnetCurrency,
        ) && (
          <div className="space-y-2">
            <Alert variant="warning">
              <Terminal className="h-4 w-4" />
              <AlertTitle>
                Warning: You are creating an invoice with real funds
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  You've selected{" "}
                  <span className="font-bold">
                    {formatCurrencyLabel(form.watch("invoiceCurrency"))}
                  </span>
                  , which operates on a mainnet blockchain and uses real
                  cryptocurrency.
                </p>
                <p>
                  EasyInvoice is a demonstration app only, designed to showcase
                  Request Network API functionality. Do not use for real
                  invoicing.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Only show payment currency selector for USD invoices */}
        {form.watch("invoiceCurrency") === "USD" && (
          <div className="space-y-2">
            <Label htmlFor="paymentCurrency">Payment Currency</Label>
            <Select
              onValueChange={(value) => form.setValue("paymentCurrency", value)}
              defaultValue={form.getValues("paymentCurrency")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment currency" />
              </SelectTrigger>
              <SelectContent>
                {getPaymentCurrenciesForInvoice("USD").map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {formatCurrencyLabel(currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.paymentCurrency && (
              <p className="text-sm text-red-500">
                {form.formState.errors.paymentCurrency.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="walletAddress">Your Wallet Address</Label>
          <Input
            {...form.register("walletAddress")}
            placeholder="Enter your wallet address"
          />
          {form.formState.errors.walletAddress && (
            <p className="text-sm text-red-500">
              {form.formState.errors.walletAddress.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="cryptoToFiatAvailable"
            checked={form.watch("cryptoToFiatAvailable")}
            onCheckedChange={(checked) => {
              form.setValue("cryptoToFiatAvailable", checked === true);
            }}
          />
          <Label htmlFor="cryptoToFiatAvailable">
            Allow payment via bank account (crypto-to-fiat conversion)
          </Label>
        </div>

        {form.watch("cryptoToFiatAvailable") && (
          <div className="space-y-2">
            <Label htmlFor="paymentDetailsId">Payment Details</Label>
            {clientEmail ? (
              isLoadingUser ? (
                <div className="text-sm text-gray-500">
                  Checking client details...
                </div>
              ) : !clientUserData ? (
                <p className="text-sm text-gray-500">
                  Client not compliant. Please use a verified client
                </p>
              ) : !clientUserData.isCompliant ? (
                <p className="text-sm text-gray-500">
                  Client is not valid for Crypto to Fiat
                </p>
              ) : linkedPaymentDetails && linkedPaymentDetails.length > 0 ? (
                <div className="space-y-2">
                  <Select
                    onValueChange={(value) =>
                      form.setValue("paymentDetailsId", value)
                    }
                    defaultValue={form.getValues("paymentDetailsId")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment details" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedPaymentDetails.map((detail) => {
                        const payer = detail.paymentDetailsPayers.find(
                          (p) => p.email === clientEmail,
                        );
                        return (
                          <SelectItem
                            key={detail.paymentDetails.id}
                            value={detail.paymentDetails.id}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span>
                                {detail.paymentDetails.accountName || "Account"}{" "}
                                ••••
                                {(
                                  detail.paymentDetails.accountNumber || ""
                                ).slice(-4)}
                              </span>
                              {payer && (
                                <span
                                  className={`ml-2 text-xs font-medium ${
                                    payer.status === "approved"
                                      ? "text-green-600"
                                      : payer.status === "pending"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {payer.status.charAt(0).toUpperCase() +
                                    payer.status.slice(1)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    No bank accounts found for this client
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBankAccountModal(true)}
                    className="w-full"
                  >
                    Add Bank Account
                  </Button>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-500">
                Enter client email to view payment details
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-black hover:bg-zinc-800 text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading
              ? "Creating..."
              : invoiceCreated
                ? "Invoice created"
                : "Create Invoice"}
          </Button>
        </div>
      </form>
    </>
  );
}
