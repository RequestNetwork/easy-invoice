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

// Payment Details Status Component
const PaymentDetailsStatus = ({ status }: { status: string }) => (
  <span
    className={`ml-2 text-xs font-medium ${
      status === "approved"
        ? "text-green-600"
        : status === "pending"
          ? "text-yellow-600"
          : "text-red-600"
    }`}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

// Payment Details Select Item Component
const PaymentDetailsSelectItem = ({
  detail,
  clientEmail,
}: {
  detail: {
    paymentDetails: PaymentDetails;
    paymentDetailsPayers: (User & PaymentDetailsPayers)[];
  };
  clientEmail: string;
}) => {
  const payer = detail.paymentDetailsPayers.find(
    (p) => p.email === clientEmail,
  );
  const lastFourDigits = detail.paymentDetails.accountNumber
    ? detail.paymentDetails.accountNumber.slice(-4)
    : "";

  return (
    <SelectItem key={detail.paymentDetails.id} value={detail.paymentDetails.id}>
      <div className="flex justify-between items-center w-full">
        <span>
          {detail.paymentDetails.accountName || "Account"} •••• {lastFourDigits}
        </span>
        {payer && <PaymentDetailsStatus status={payer.status} />}
      </div>
    </SelectItem>
  );
};

// Payment Details Loading State
const PaymentDetailsLoading = () => (
  <div className="text-sm text-gray-500">Checking client details...</div>
);

// Payment Details Error States
const PaymentDetailsError = ({ message }: { message: string }) => (
  <p className="text-sm text-gray-500">{message}</p>
);

// Payment Details Empty State
const PaymentDetailsEmpty = ({ onAdd }: { onAdd: () => void }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-500">
      No bank accounts found for this client
    </p>
    <Button type="button" variant="outline" onClick={onAdd} className="w-full">
      Add Bank Account
    </Button>
  </div>
);

// Payment Details Select Component
const PaymentDetailsSelect = ({
  details,
  clientEmail,
  onSelect,
  defaultValue,
}: {
  details: {
    paymentDetails: PaymentDetails;
    paymentDetailsPayers: (User & PaymentDetailsPayers)[];
  }[];
  clientEmail: string;
  onSelect: (value: string) => void;
  defaultValue?: string;
}) => (
  <div className="space-y-2">
    <Select onValueChange={onSelect} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select payment details" />
      </SelectTrigger>
      <SelectContent>
        {details.map((detail) => (
          <PaymentDetailsSelectItem
            key={detail.paymentDetails.id}
            detail={detail}
            clientEmail={clientEmail}
          />
        ))}
      </SelectContent>
    </Select>
  </div>
);

// Payment Details Section Component
const PaymentDetailsSection = ({
  clientEmail,
  isLoadingUser,
  clientUserData,
  linkedPaymentDetails,
  onAddBankAccount,
  onSelectPaymentDetails,
  selectedPaymentDetailsId,
}: {
  clientEmail: string;
  isLoadingUser: boolean;
  clientUserData: User | null | undefined;
  linkedPaymentDetails:
    | {
        paymentDetails: PaymentDetails;
        paymentDetailsPayers: (User & PaymentDetailsPayers)[];
      }[]
    | undefined;
  onAddBankAccount: () => void;
  onSelectPaymentDetails: (value: string) => void;
  selectedPaymentDetailsId?: string;
}) => {
  if (!clientEmail) {
    return (
      <PaymentDetailsError message="Enter client email to view payment details" />
    );
  }

  if (isLoadingUser) {
    return <PaymentDetailsLoading />;
  }

  if (!clientUserData) {
    return (
      <PaymentDetailsError message="Client not compliant. Please use a verified client" />
    );
  }

  if (!clientUserData.isCompliant) {
    return (
      <PaymentDetailsError message="Client is not valid for Crypto to Fiat" />
    );
  }

  if (!linkedPaymentDetails || linkedPaymentDetails.length === 0) {
    return <PaymentDetailsEmpty onAdd={onAddBankAccount} />;
  }

  return (
    <PaymentDetailsSelect
      details={linkedPaymentDetails.map(
        ({ paymentDetails, paymentDetailsPayers }) => ({
          paymentDetails,
          paymentDetailsPayers,
        }),
      )}
      clientEmail={clientEmail}
      onSelect={onSelectPaymentDetails}
      defaultValue={selectedPaymentDetailsId}
    />
  );
};

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
  const isCryptoToFiatAvailable = form.watch("isCryptoToFiatAvailable");

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

  useEffect(() => {
    // Filter payment details based on client email and compliance status
    const filterValidPaymentDetails = (
      paymentDetails: (PaymentDetails & {
        paymentDetailsPayers: (User & PaymentDetailsPayers)[];
      })[],
      clientEmail: string,
    ): (PaymentDetails & {
      paymentDetailsPayers: (User & PaymentDetailsPayers)[];
    })[] => {
      return paymentDetails.filter((detail) => {
        const hasMatchingPayer = detail.paymentDetailsPayers.some(
          (payer: User & PaymentDetailsPayers) => payer.email === clientEmail,
        );

        if (hasMatchingPayer) {
          const matchingPayer = detail.paymentDetailsPayers.find(
            (payer: User & PaymentDetailsPayers) => payer.email === clientEmail,
          );
          if (matchingPayer) {
            return matchingPayer.isCompliant;
          }
        }
        return false;
      });
    };

    // Helper function to check if payment details are approved
    const checkPaymentDetailsApproval = (
      paymentDetailsId: string,
      validPaymentDetails: (PaymentDetails & {
        paymentDetailsPayers: (User & PaymentDetailsPayers)[];
      })[],
      clientEmail: string,
    ) => {
      const selectedPaymentDetail = validPaymentDetails.find(
        (detail) => detail.id === paymentDetailsId,
      );

      if (!selectedPaymentDetail) return false;
      const payer = selectedPaymentDetail.paymentDetailsPayers.find(
        (p: User & PaymentDetailsPayers) => p.email === clientEmail,
      );

      return payer?.status === "approved";
    };

    if (
      isCryptoToFiatAvailable &&
      clientEmail &&
      paymentDetailsData?.paymentDetails &&
      clientUserData
    ) {
      if (clientUserData.isCompliant && paymentDetailsData.paymentDetails) {
        const validPaymentDetails = filterValidPaymentDetails(
          paymentDetailsData.paymentDetails,
          clientEmail,
        );

        // Transform the payment details into the expected format
        const formattedPaymentDetails = validPaymentDetails.map((detail) => ({
          paymentDetails: detail,
          paymentDetailsPayers: detail.paymentDetailsPayers,
        }));

        setLinkedPaymentDetails(formattedPaymentDetails);

        // Check if the selected payment details are now approved
        if (showPendingApprovalModal && form.getValues("paymentDetailsId")) {
          const isApproved = checkPaymentDetailsApproval(
            form.getValues("paymentDetailsId") ?? "",
            validPaymentDetails,
            clientEmail,
          );

          if (isApproved) {
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
      } else {
        setLinkedPaymentDetails([]);
      }
    }
  }, [
    clientEmail,
    isCryptoToFiatAvailable,
    paymentDetailsData?.paymentDetails,
    clientUserData,
    showPendingApprovalModal,
    form,
  ]);

  const handleFormSubmit = async (data: InvoiceFormValues) => {
    // If C2F is enabled but no payment details are linked, show bank account modal
    if (data.isCryptoToFiatAvailable && !data.paymentDetailsId) {
      setShowBankAccountModal(true);
      return;
    }

    // Check if payment details have approved status
    if (data.isCryptoToFiatAvailablele && data.paymentDetailsId) {
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
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Failed to create invoice: ${error.message}`
          : "Failed to create invoice due to an unknown error",
      );
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
            id="isCryptoToFiatAvailable"
            checked={form.watch("isCryptoToFiatAvailable")}
            onCheckedChange={(checked) => {
              form.setValue("isCryptoToFiatAvailable", checked === true);
            }}
          />
          <Label htmlFor="isCryptoToFiatAvailable">
            Allow payment via bank account (crypto-to-fiat conversion)
          </Label>
        </div>

        {form.watch("isCryptoToFiatAvailable") && (
          <div className="space-y-2">
            <Label htmlFor="paymentDetailsId">Payment Details</Label>
            <PaymentDetailsSection
              clientEmail={clientEmail}
              isLoadingUser={isLoadingUser}
              clientUserData={clientUserData}
              linkedPaymentDetails={linkedPaymentDetails}
              onAddBankAccount={() => setShowBankAccountModal(true)}
              onSelectPaymentDetails={(value) =>
                form.setValue("paymentDetailsId", value)
              }
              selectedPaymentDetailsId={form.getValues("paymentDetailsId")}
            />
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
