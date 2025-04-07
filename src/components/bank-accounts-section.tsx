"use client";

import { BankAccountForm } from "@/components/bank-account-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PaymentDetailsPayers, User } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BankAccountsSectionProps {
  user: User;
}

export function BankAccountsSection({ user }: BankAccountsSectionProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [linkingAccountId, setLinkingAccountId] = useState<string | null>(null);
  const [payerEmail, setPayerEmail] = useState<string>("");

  const { data, isLoading, error, refetch } =
    api.compliance.getPaymentDetails.useQuery({
      userId: user.id,
    });

  const allowPaymentDetailsMutation =
    api.compliance.allowPaymentDetails.useMutation({
      onSuccess: () => {
        toast.success("Bank account linked successfully");
        setLinkingAccountId(null);
        setPayerEmail("");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to link bank account: ${error.message}`);
      },
    });

  const handleSuccess = () => {
    refetch();
    setIsAddingNew(false);
  };

  const handleLinkAccount = (accountId: string) => {
    if (!payerEmail.trim()) {
      toast.error("Payer Email required");
      return;
    }

    allowPaymentDetailsMutation.mutate({
      userId: user.id,
      paymentDetailsId: accountId,
      payerEmail: payerEmail,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <p>Error: {error.message}</p>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      {data && data.paymentDetails.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Your Bank Accounts</h3>
          {data.paymentDetails
            .map((item) => {
              const account = item.paymentDetails;
              const payersForAccount = item.paymentDetailsPayers || [];

              return (
                <Card key={account?.id} className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Account Name
                      </p>
                      <p>{account?.accountName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Bank Name
                      </p>
                      <p>{account?.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Account Number
                      </p>
                      <p>•••• {(account?.accountNumber || "").slice(-4)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Currency
                      </p>
                      <p>{account?.currency?.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Routing Number
                      </p>
                      <p>{account?.routingNumber || "N/A"}</p>
                    </div>
                    {account?.addressLine1 && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Address
                        </p>
                        <p>
                          {account?.addressLine1}
                          {account?.addressLine2
                            ? `, ${account?.addressLine2}`
                            : ""}
                          , {account?.city}, {account?.state}{" "}
                          {account?.postalCode}, {account?.country}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <div className="flex flex-col gap-2">
                      {payersForAccount.length > 0 ? (
                        <>
                          <p className="text-sm font-medium text-muted-foreground">
                            Payers
                          </p>
                          <div className="flex flex-col gap-2">
                            {payersForAccount.map(
                              (payer: User & PaymentDetailsPayers) => (
                                <div
                                  key={payer.id}
                                  className="flex justify-between"
                                >
                                  {payer.email}
                                  <span
                                    className={
                                      payer.status === "pending"
                                        ? "text-orange-500"
                                        : payer.status === "approved"
                                          ? "text-green-500"
                                          : "text-red-500"
                                    }
                                  >
                                    {payer.status.charAt(0).toUpperCase() +
                                      payer.status.slice(1)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">
                          No payers linked
                        </p>
                      )}
                    </div>
                    <div className="mt-4 border-t pt-4 flex justify-end w-full">
                      {linkingAccountId === account?.id ? (
                        <div className="space-y-2 w-full">
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              placeholder="Enter Payer Email"
                              value={payerEmail}
                              onChange={(e) => setPayerEmail(e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleLinkAccount(account?.id)}
                              disabled={allowPaymentDetailsMutation.isLoading}
                            >
                              {allowPaymentDetailsMutation.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Link"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLinkingAccountId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enter the Email of the payer you want to allow to
                            use this bank account.
                          </p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => setLinkingAccountId(account?.id)}
                        >
                          <LinkIcon className="h-4 w-4" />
                          Link with Payer
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
            .filter(Boolean)}
          {!isAddingNew ? (
            <Button className="mt-4" onClick={() => setIsAddingNew(true)}>
              Add Another Bank Account
            </Button>
          ) : (
            <div className="mt-6 border-t pt-6">
              <h3 className="mb-4 text-lg font-medium">Add New Bank Account</h3>
              <BankAccountForm
                user={user}
                onSuccess={handleSuccess}
                onCancel={() => setIsAddingNew(false)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            You haven't added any bank accounts yet. Add your bank details to
            receive payments from invoices.
          </p>
          <BankAccountForm user={user} onSuccess={handleSuccess} />
        </div>
      )}
    </>
  );
}
