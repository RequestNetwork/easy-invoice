"use client";

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
import { PaymentDetailsStatus as PaymentDetailsStatusEnum } from "@/lib/constants/bank-account";
import {
  INVOICE_CURRENCIES,
  type InvoiceCurrency,
  MAINNET_CURRENCIES,
  type MainnetCurrency,
  formatCurrencyLabel,
} from "@/lib/constants/currencies";
import type { InvoiceFormValues } from "@/lib/schemas/invoice";
import type {
  PaymentDetails,
  PaymentDetailsPayers,
  User,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Terminal, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { BankAccountForm } from "./blocks/bank-account-form";
import { PaymentCurrencySelector } from "./blocks/payment-currency-selector";

const AnimatedSection = ({
  show,
  children,
  className = "",
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element => {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: {
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            },
            opacity: {
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          style={{ overflow: "hidden" }}
          className={className}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.2,
              delay: 0.05,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Constants
const PAYMENT_DETAILS_POLLING_INTERVAL = 30000; // 30 seconds in milliseconds
const BANK_ACCOUNT_APPROVAL_TIMEOUT = 60000; // 1 minute timeout for bank account approval
const DEFAULT_NETWORK = "sepolia";

type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type LinkedPaymentDetail = {
  paymentDetails: PaymentDetails;
  paymentDetailsPayers: (User & PaymentDetailsPayers)[];
};

// Filter payment details based on compliance status only
const filterValidPaymentDetails = (
  paymentDetails: (PaymentDetails & {
    paymentDetailsPayers: (User & PaymentDetailsPayers)[];
  })[],
): LinkedPaymentDetail[] => {
  // Return all payment details without filtering by client email
  const validPaymentDetails = paymentDetails.filter((detail) => {
    // Check if any payer is compliant
    return detail.paymentDetailsPayers.some(
      (payer: User & PaymentDetailsPayers) => payer.isCompliant,
    );
  });
  return validPaymentDetails as unknown as LinkedPaymentDetail[];
};

// Helper function to check if payment details are approved
const checkPaymentDetailsApproval = (
  paymentDetailsId: string,
  validPaymentDetails: LinkedPaymentDetail[],
  clientEmail: string,
) => {
  const selectedPaymentDetail = validPaymentDetails.find(
    (detail) => detail.paymentDetails.id === paymentDetailsId,
  );

  if (!selectedPaymentDetail) return false;
  const payer = selectedPaymentDetail.paymentDetailsPayers.find(
    (p) => p.email === clientEmail,
  );

  return payer?.status === PaymentDetailsStatusEnum.APPROVED;
};

interface InvoiceFormProps {
  currentUser: User;
  form: UseFormReturn<InvoiceFormValues>;
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  isLoading: boolean;
  recipientDetails?: {
    clientName: string;
    clientEmail: string;
    userId: string;
  };
  complianceUserId: string;
}

// Payment Details Status Component
const PaymentDetailsStatus = ({ status }: { status: string | null }) => (
  <span
    className={`ml-2 text-xs font-medium ${
      status === PaymentDetailsStatusEnum.APPROVED
        ? "text-green-600"
        : status === PaymentDetailsStatusEnum.PENDING
          ? "text-yellow-600"
          : "text-red-600"
    }`}
  >
    {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
  </span>
);

// Payment Details Select Item Component
const PaymentDetailsSelectItem = ({
  detail,
  clientEmail,
}: {
  detail: LinkedPaymentDetail;
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
      No payment methods found for this client
    </p>
    <Button type="button" variant="outline" onClick={onAdd} className="w-full">
      Add Payment Method
    </Button>
  </div>
);

// Payment Details Select Component
const PaymentDetailsSelect = ({
  details,
  clientEmail,
  onSelect,
  defaultValue,
  error,
}: {
  details: LinkedPaymentDetail[];
  clientEmail: string;
  onSelect: (value: string) => void;
  defaultValue?: string;
  error?: string;
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
    {error && <p className="text-sm text-red-500">{error}</p>}
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
  error,
}: {
  clientEmail: string;
  isLoadingUser: boolean;
  clientUserData:
    | {
        id: string;
        name: string | null;
        email: string | null;
        isCompliant: boolean | null;
      }
    | null
    | undefined;
  linkedPaymentDetails: LinkedPaymentDetail[] | undefined;
  onAddBankAccount: () => void;
  onSelectPaymentDetails: (value: string) => void;
  selectedPaymentDetailsId?: string;
  error?: string;
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
      <PaymentDetailsError message="Client has not completed KYC. Please use a verified client." />
    );
  }

  if (!clientUserData.isCompliant) {
    return (
      <PaymentDetailsError message="Client's KYC application was rejected. Please use a verified client." />
    );
  }

  if (!linkedPaymentDetails || linkedPaymentDetails.length === 0) {
    return <PaymentDetailsEmpty onAdd={onAddBankAccount} />;
  }
  return (
    <PaymentDetailsSelect
      details={linkedPaymentDetails}
      clientEmail={clientEmail}
      onSelect={onSelectPaymentDetails}
      defaultValue={selectedPaymentDetailsId}
      error={error}
    />
  );
};

export function InvoiceForm({
  currentUser,
  form,
  onSubmit,
  isLoading,
  recipientDetails,
  complianceUserId,
}: InvoiceFormProps) {
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [showPendingApprovalModal, setShowPendingApprovalModal] =
    useState(false);
  const [waitingForPaymentApproval, setWaitingForPaymentApproval] =
    useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedPaymentDetails, setLinkedPaymentDetails] = useState<
    LinkedPaymentDetail[]
  >([]);

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
      {
        userId: complianceUserId,
      },
      {
        enabled: !!clientUserData?.id,
        // Use the configurable constant for polling interval
        refetchInterval: PAYMENT_DETAILS_POLLING_INTERVAL,
        // Also refetch when the window regains focus
        refetchOnWindowFocus: true,
      },
    );

  const allowPaymentDetailsMutation =
    api.compliance.allowPaymentDetails.useMutation({
      onSuccess: () => {
        refetchPaymentDetails();
      },
      onError: (error) => {
        toast.error(`Failed to link payment method: ${error.message}`);
      },
    });

  // Extract handleBankAccountSuccess into useCallback
  const handleBankAccountSuccess = useCallback(
    async (result: {
      success: boolean;
      message: string;
      paymentDetails: PaymentDetails | null;
    }) => {
      setShowBankAccountModal(false);

      try {
        // Only proceed if we have payment details
        if (result.success && result.paymentDetails) {
          // Link the payment method to the client
          await allowPaymentDetailsMutation.mutateAsync({
            userId: result.paymentDetails.userId,
            paymentDetailsId: result.paymentDetails.id,
            payerEmail: clientEmail,
          });

          // Update the form with the new payment details
          form.setValue("paymentDetailsId", result.paymentDetails.id);

          // Refetch payment details to update the UI
          await refetchPaymentDetails();

          toast.success("Payment method linked successfully");
        } else {
          toast.error(result.message || "Failed to create payment details");
        }
      } catch (error) {
        console.error("Error linking payment method:", error);
        toast.error("Failed to link payment method to client");
      }
    },
    [clientEmail, form, refetchPaymentDetails, allowPaymentDetailsMutation],
  );

  // Define a stable reference to the submit handler
  const handleFormSubmit = useCallback(
    async (data: InvoiceFormValues) => {
      // Prevent multiple submissions
      if (isSubmitting) return;
      setIsSubmitting(true);

      // Check if payment details have approved status
      if (data.isCryptoToFiatAvailable && data.paymentDetailsId) {
        const selectedPaymentDetail = linkedPaymentDetails?.find(
          (detail) => detail.paymentDetails.id === data.paymentDetailsId,
        );

        if (selectedPaymentDetail) {
          const payer = selectedPaymentDetail.paymentDetailsPayers.find(
            (p: User & PaymentDetailsPayers) => p.email === data.clientEmail,
          );

          if (payer) {
            if (payer.status === PaymentDetailsStatusEnum.PENDING) {
              setShowPendingApprovalModal(true);
              setWaitingForPaymentApproval(true);
              // Keep isSubmitting true while waiting for approval to prevent multiple submissions
              return;
            }
            if (payer.status !== PaymentDetailsStatusEnum.APPROVED) {
              toast.error(
                "Cannot create invoice with unapproved payment method",
              );
              setIsSubmitting(false);
              return;
            }
          } else {
            setShowPendingApprovalModal(true);
            setWaitingForPaymentApproval(true);
            await handleBankAccountSuccess({
              success: true,
              message: "Payment method linked successfully",
              paymentDetails: selectedPaymentDetail.paymentDetails,
            });
          }
        }
      }

      try {
        await onSubmit(data);
        setInvoiceCreated(true);
        setWaitingForPaymentApproval(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Failed to create invoice: ${error.message}`
            : "Failed to create invoice due to an unknown error",
        );
        setInvoiceCreated(false);
        setWaitingForPaymentApproval(false);
        setIsSubmitting(false);
      }
    },
    [linkedPaymentDetails, onSubmit, isSubmitting, handleBankAccountSuccess],
  );

  // Add timeout effect for pending approval modal
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showPendingApprovalModal) {
      timeoutId = setTimeout(() => {
        setShowPendingApprovalModal(false);
        toast.error("Bank account approval timed out. Please try again.");
      }, BANK_ACCOUNT_APPROVAL_TIMEOUT);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showPendingApprovalModal]);

  // Effect for processing and setting payment details
  useEffect(() => {
    if (
      isCryptoToFiatAvailable &&
      clientEmail &&
      paymentDetailsData?.paymentDetails &&
      clientUserData
    ) {
      if (clientUserData.isCompliant && paymentDetailsData.paymentDetails) {
        const validPaymentDetails = filterValidPaymentDetails(
          paymentDetailsData.paymentDetails,
        );
        setLinkedPaymentDetails(validPaymentDetails);
      } else {
        setLinkedPaymentDetails([]);
      }
    }
  }, [
    clientEmail,
    isCryptoToFiatAvailable,
    paymentDetailsData?.paymentDetails,
    clientUserData,
  ]);

  // Effect to disable Crypto-to-fiat when payment currency is not Sepolia USDC
  useEffect(() => {
    const paymentCurrency = form.watch("paymentCurrency");
    const isCryptoToFiatEnabled = form.watch("isCryptoToFiatAvailable");

    if (paymentCurrency !== "fUSDC-sepolia" && isCryptoToFiatEnabled) {
      form.setValue("isCryptoToFiatAvailable", false);
      // Clear payment details when disabling crypto-to-fiat
      form.setValue("paymentDetailsId", "");
      form.clearErrors("paymentDetailsId");
    }
  }, [form]);

  // Extract submission logic into a separate function
  const submitAfterApproval = useCallback(async () => {
    // Show success message
    toast.success("Payment method approved! Creating invoice...");

    try {
      // Reset the submitting state and directly call onSubmit
      setIsSubmitting(false);

      // Get the current form values
      const formData = form.getValues();

      // Call onSubmit directly, bypassing handleFormSubmit guards
      await onSubmit(formData);
      setInvoiceCreated(true);
      setWaitingForPaymentApproval(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Failed to create invoice: ${error.message}`
          : "Failed to create invoice due to an unknown error",
      );
      setInvoiceCreated(false);
      setWaitingForPaymentApproval(false);
      setIsSubmitting(false);
    }
  }, [form, onSubmit]);

  // Separate effect for handling payment approval and form submission
  useEffect(() => {
    if (
      waitingForPaymentApproval &&
      form.getValues("paymentDetailsId") &&
      linkedPaymentDetails.length > 0 &&
      clientEmail
    ) {
      const isApproved = checkPaymentDetailsApproval(
        form.getValues("paymentDetailsId") ?? "",
        linkedPaymentDetails,
        clientEmail,
      );

      if (isApproved) {
        // Clear the waiting state
        setWaitingForPaymentApproval(false);
        // Close the modal if it's still open
        setShowPendingApprovalModal(false);
        // Use the extracted submission logic
        void submitAfterApproval();
      }
    } else if (!waitingForPaymentApproval && isSubmitting) {
      // If we're no longer waiting for approval but isSubmitting is still true
      // (happens if user cancels or approval fails)
      setIsSubmitting(false);
    }
  }, [
    waitingForPaymentApproval,
    linkedPaymentDetails,
    clientEmail,
    form,
    submitAfterApproval,
    isSubmitting,
  ]);

  return (
    <>
      <Dialog
        open={showBankAccountModal}
        onOpenChange={setShowBankAccountModal}
      >
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          {clientUserData && (
            <BankAccountForm
              user={currentUser}
              onSuccess={handleBankAccountSuccess}
              onCancel={() => setShowBankAccountModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPendingApprovalModal}
        onOpenChange={(open) => {
          setShowPendingApprovalModal(open);
          // Don't reset the waiting state when closing the modal
          // This allows the approval check to continue running in the background
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Method Pending Approval</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground" />
            <p className="text-center text-muted-foreground">
              The payment method you selected is currently pending approval.
              Please wait until it is approved before creating an invoice.
            </p>
            <p className="text-center text-muted-foreground text-sm">
              You can close this dialog. We'll notify you when approval is
              complete.
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

        <AnimatedSection show={form.watch("isRecurring")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
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
        </AnimatedSection>

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
            <div key={field.id} className="flex items-start gap-4">
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
                    min: 1,
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
                  {currency === "fUSDC-sepolia" && (
                    <span className="ml-2 text-xs text-green-600 font-medium">
                      (works with Crypto-to-fiat)
                    </span>
                  )}
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
        <AnimatedSection
          show={MAINNET_CURRENCIES.includes(
            form.watch("invoiceCurrency") as MainnetCurrency,
          )}
        >
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
        </AnimatedSection>

        {/* Only show payment currency selector for USD invoices */}
        <AnimatedSection show={form.watch("invoiceCurrency") === "USD"}>
          <div className="space-y-2 pt-4">
            <PaymentCurrencySelector
              onChange={(value) => form.setValue("paymentCurrency", value)}
              targetCurrency="USD"
              network={DEFAULT_NETWORK}
            />
            {form.formState.errors.paymentCurrency && (
              <p className="text-sm text-red-500">
                {form.formState.errors.paymentCurrency.message}
              </p>
            )}
          </div>
        </AnimatedSection>

        <div
          className={`flex items-center space-x-2 ${
            form.watch("paymentCurrency") !== "fUSDC-sepolia"
              ? "opacity-60"
              : ""
          }`}
        >
          <Checkbox
            id="isCryptoToFiatAvailable"
            checked={form.watch("isCryptoToFiatAvailable")}
            onCheckedChange={(checked) => {
              form.setValue("isCryptoToFiatAvailable", checked === true);
              // When toggling, clear the fields that are no longer relevant
              if (checked === true) {
                // Clear wallet address when enabling crypto-to-fiat
                form.setValue("walletAddress", "");
                form.clearErrors("walletAddress");
              } else {
                // Clear payment details when disabling crypto-to-fiat
                form.setValue("paymentDetailsId", "");
                form.clearErrors("paymentDetailsId");
              }
            }}
            disabled={form.watch("paymentCurrency") !== "fUSDC-sepolia"}
          />
          <Label
            htmlFor="isCryptoToFiatAvailable"
            className={
              form.watch("paymentCurrency") !== "fUSDC-sepolia"
                ? "text-muted-foreground cursor-not-allowed"
                : ""
            }
          >
            Allow payment to your bank account (Crypto-to-fiat payment)
          </Label>
        </div>
        {form.watch("paymentCurrency") !== "fUSDC-sepolia" &&
          form.watch("isCryptoToFiatAvailable") && (
            <p className="text-xs text-amber-600">
              Crypto-to-fiat is only available with Sepolia USDC. Changing
              payment currency will disable this option.
            </p>
          )}
        {form.watch("paymentCurrency") !== "fUSDC-sepolia" &&
          !form.watch("isCryptoToFiatAvailable") && (
            <p className="text-xs text-gray-500">
              Crypto-to-fiat is only available with Sepolia USDC
            </p>
          )}

        <AnimatedSection show={form.watch("isCryptoToFiatAvailable")}>
          <div className="pt-4">
            {clientUserData?.isCompliant ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="paymentDetailsId">Payment Method</Label>
                  {linkedPaymentDetails.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBankAccountModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add New
                    </Button>
                  )}
                </div>
                <PaymentDetailsSection
                  clientEmail={clientEmail}
                  isLoadingUser={isLoadingUser}
                  clientUserData={clientUserData}
                  linkedPaymentDetails={linkedPaymentDetails}
                  onAddBankAccount={() => setShowBankAccountModal(true)}
                  onSelectPaymentDetails={(value) => {
                    form.setValue("paymentDetailsId", value);
                    // Clear the error when a payment method is selected
                    form.clearErrors("paymentDetailsId");
                  }}
                  selectedPaymentDetailsId={form.getValues("paymentDetailsId")}
                  error={form.formState.errors.paymentDetailsId?.message}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="paymentDetailsId">Payment Method</Label>
                <p className="text-sm text-red-500">
                  Client has not completed KYC. Please use a verified client.
                </p>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection show={!form.watch("isCryptoToFiatAvailable")}>
          <div className="space-y-2 pt-4">
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
        </AnimatedSection>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/80 text-primary-foreground transition-colors"
            disabled={isLoading || isSubmitting || invoiceCreated}
          >
            {isLoading || isSubmitting
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
