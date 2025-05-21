"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPLIANCE_COUNTRIES } from "@/lib/constants/compliance";
import {
  BeneficiaryType,
  type ComplianceFormValues,
  complianceFormSchema,
} from "@/lib/schemas/compliance";
import type { User } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ComplianceStatus, type StatusType } from "./compliance-status";

type ComplianceResponse = {
  agreementUrl: string | null;
  kycUrl: string | null;
  status: {
    agreementStatus: StatusType;
    kycStatus: StatusType;
    isCompliant: boolean;
  };
};

const COMPLIANCE_STATUS_POLLING_INTERVAL = 30000; // 30 seconds

export function ComplianceForm({ user }: { user: User }) {
  const [complianceData, setComplianceData] =
    useState<ComplianceResponse | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGINS = useMemo(() => {
    const origins = process.env.NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS
      ? process.env.NEXT_PUBLIC_CRYPTO_TO_FIAT_TRUSTED_ORIGINS.split(",")
      : ["https://request.network", "https://core-api-staging.pay.so"];

    // Add localhost in development
    if (process.env.NODE_ENV === "development") {
      origins.push("http://localhost:3000");
    }

    return origins;
  }, []);

  // Fetch compliance status when component mounts
  const { isLoading: isLoadingStatus, refetch: getComplianceStatus } =
    api.compliance.getComplianceStatus.useQuery(
      { clientUserId: user?.email ?? "" },
      {
        // Only fetch if we have a user email
        enabled: !!user?.email,
        // Use the configurable constant for polling interval
        refetchInterval: COMPLIANCE_STATUS_POLLING_INTERVAL,
        // Also refetch when the window regains focus
        refetchOnWindowFocus: true,
        onSuccess: (data) => {
          // If the user is already compliant, we can skip the form
          if (data.success) {
            // Set compliance data with status from the API
            setComplianceData({
              agreementUrl: (data.data.agreementUrl as string) ?? null,
              kycUrl: (data.data.kycUrl as string) ?? null,
              status: {
                agreementStatus: data.data.agreementStatus as StatusType,
                kycStatus: data.data.kycStatus as StatusType,
                isCompliant: data.data.isCompliant,
              },
            });
          }
        },
      },
    );

  const submitComplianceMutation =
    api.compliance.submitComplianceInfo.useMutation({
      onSuccess: (response) => {
        if (response.success) {
          setComplianceData({
            agreementUrl: (response.data.agreementUrl as string) ?? null,
            kycUrl: (response.data.kycUrl as string) ?? null,
            status: {
              agreementStatus: response.data.agreementStatus as StatusType,
              kycStatus: response.data.kycStatus as StatusType,
              isCompliant: response.data.isCompliant,
            },
          });
          getComplianceStatus();
          toast.success("Compliance information submitted successfully");
        } else {
          toast.error(
            `Failed to submit compliance information${response.message ? `. Error: ${response.message}` : ""}`,
          );
        }
      },
      onError: (error) => {
        console.error("Compliance submission error:", error);
        toast.error(
          `Failed to submit compliance information${error instanceof Error ? `. Error: ${error.message}` : ". Please try again."}`,
        );
      },
    });

  const updateAgreementStatusMutation =
    api.compliance.updateAgreementStatus.useMutation({
      onSuccess: () => {
        toast.success("Agreement completed successfully");
        getComplianceStatus();
      },
      onError: (error) => {
        console.error("Error updating agreement status:", error);
        toast.error("Failed to update agreement status. Please try again.");
      },
    });

  const handleAgreementUpdate = useCallback(() => {
    updateAgreementStatusMutation.mutate({
      clientUserId: user?.email ?? "",
    });
  }, [updateAgreementStatusMutation, user?.email]);

  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceFormSchema),
    defaultValues: {
      clientUserId: user?.email ?? "",
      email: user?.email ?? "",
      firstName: "",
      lastName: "",
      beneficiaryType: BeneficiaryType.INDIVIDUAL,
      companyName: "",
      dateOfBirth: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
      country: "",
      nationality: "",
      phone: "",
      ssn: "",
      sourceOfFunds: "",
      businessActivity: "",
    },
  });

  // Set up a listener for the agreement events
  useEffect(() => {
    const onCompleteHandler = (event: MessageEvent) => {
      // Validate the origin of the message
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        console.warn(
          `Received postMessage from untrusted origin: ${event.origin}`,
        );
        return;
      }

      if (event.data.agreements === "complete") {
        setShowAgreementModal(false);
        // Notify the Request Network API that the agreement is completed
        handleAgreementUpdate();
      } else if (
        event.data.agreements &&
        Object.keys(event.data.agreements).find((i) => i.includes("agreed"))
      ) {
        // When a user has signed an agreement, refresh the iframe src
        // This improves cross-browser support and prevents caching issues
        if (iframeRef.current && complianceData?.agreementUrl) {
          iframeRef.current.src = complianceData.agreementUrl;
        }
      }
    };

    window.addEventListener("message", onCompleteHandler);
    return () => {
      window.removeEventListener("message", onCompleteHandler);
    };
  }, [handleAgreementUpdate, complianceData?.agreementUrl, TRUSTED_ORIGINS]);

  async function onSubmit(values: ComplianceFormValues) {
    try {
      await submitComplianceMutation.mutateAsync(values);
      toast.success("Compliance information submitted successfully!");
    } catch (error) {
      toast.error(
        `Failed to submit compliance information${error instanceof Error ? `. Error: ${error.message}` : ". Please try again."}`,
      );
    }
  }

  return (
    <div className="w-full">
      {isLoadingStatus ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {submitComplianceMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {submitComplianceMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {complianceData?.status.kycStatus !== "not_started" ||
          complianceData?.status.agreementStatus !== "not_started" ? (
            <div className="flex flex-col gap-6 w-full">
              <div>
                <ComplianceStatus status={complianceData?.status} />
              </div>

              <div>
                {complianceData?.status.agreementStatus === "pending" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Agreement</CardTitle>
                      <CardDescription>
                        Review and sign the compliance agreement
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAgreementModal(true)}
                        disabled={!complianceData?.agreementUrl}
                      >
                        Open Agreement <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {complianceData?.status?.agreementStatus === "completed" &&
                  complianceData?.status?.kycStatus === "initiated" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>KYC Verification</CardTitle>
                        <CardDescription>
                          Complete your identity verification
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (complianceData?.kycUrl) {
                              window.open(complianceData.kycUrl, "_blank");
                            }
                          }}
                          disabled={!complianceData?.kycUrl}
                        >
                          Start KYC Process{" "}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {/* Agreement Modal */}
              <Dialog
                open={showAgreementModal}
                onOpenChange={setShowAgreementModal}
              >
                <DialogContent className="max-w-4xl h-[90vh] p-0">
                  <DialogHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-xl font-semibold">
                        Compliance Agreement
                      </DialogTitle>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 h-[calc(90vh-65px)] relative">
                    {isIframeLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    )}
                    <iframe
                      ref={iframeRef}
                      src={complianceData?.agreementUrl ?? ""}
                      className="w-full h-full border-0"
                      title="Compliance Agreement"
                      width="100%"
                      height="100%"
                      onLoad={() => setIsIframeLoading(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Information</CardTitle>
                <CardDescription>
                  Please provide your information for KYC and compliance
                  verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              First Name<span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Last Name<span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="beneficiaryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Beneficiary Type
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="individual">
                                  Individual
                                </SelectItem>
                                <SelectItem value="business">
                                  Business
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("beneficiaryType") === "business" && (
                        <>
                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Company Name
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sourceOfFunds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Source of Funds
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Business Revenue"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="businessActivity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Business Activity
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Software Development"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Date of Birth
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Address Line 1
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apt 4B" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              City<span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              State<span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Postcode<span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Country<span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMPLIANCE_COUNTRIES.map((country) => (
                                  <SelectItem
                                    key={country.value}
                                    value={country.value}
                                  >
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Nationality<span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select nationality" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMPLIANCE_COUNTRIES.map((country) => (
                                  <SelectItem
                                    key={country.value}
                                    value={country.value}
                                  >
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Phone (E.164 format)
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+12125551234"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ssn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Social Security Number
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="123-45-6789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitComplianceMutation.isLoading}
                    >
                      {submitComplianceMutation.isLoading
                        ? "Submitting..."
                        : "Submit Compliance Information"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
