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
import {
  type ComplianceFormValues,
  complianceFormSchema,
} from "@/lib/schemas/compliance";
import type { User } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ComplianceStatus } from "./compliance-status";

type ComplianceResponse = {
  agreementUrl: string;
  kycUrl: string;
  status: {
    agreementStatus: "not_started" | "pending" | "completed";
    kycStatus: "not_started" | "pending" | "completed";
    isCompliant: boolean;
  };
};

export function ComplianceForm({ user }: { user: User }) {
  const [complianceData, setComplianceData] =
    useState<ComplianceResponse | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGIN = "https://request.network"; // Adjust this to match your actual domain

  // Fetch compliance status when component mounts
  const { isLoading: isLoadingStatus, refetch: getComplianceStatus } =
    api.compliance.getComplianceStatus.useQuery(
      { clientUserId: user?.email ?? "" },
      {
        // Only fetch if we have a user email
        enabled: !!user?.email,
        // Don't refetch on window focus to avoid disrupting the user
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
          // If the user is already compliant, we can skip the form
          if (data.success) {
            // Set compliance data with status from the API
            setComplianceData({
              agreementUrl: data.data.agreementUrl, // These will be filled in when needed
              kycUrl: data.data.kycUrl,
              status: {
                agreementStatus: data.data.agreementStatus,
                kycStatus: data.data.kycStatus,
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
          setComplianceData(response.data);
          getComplianceStatus();
        } else {
          toast.error(response.message);
        }
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
      beneficiaryType: "individual",
      dateOfBirth: "",
      addressLine1: "",
      city: "",
      state: "",
      postcode: "",
      country: "",
      nationality: "",
      phone: "",
      ssn: "",
    },
  });

  // Set up a listener for the agreement events
  useEffect(() => {
    const onCompleteHandler = (event: MessageEvent) => {
      // Validate the origin of the message
      if (event.origin !== TRUSTED_ORIGIN) {
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
  }, [handleAgreementUpdate, complianceData?.agreementUrl]);

  async function onSubmit(values: ComplianceFormValues) {
    submitComplianceMutation.mutate(values);
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
                {complianceData?.status && (
                  <ComplianceStatus status={complianceData?.status} />
                )}
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
                      >
                        Open Agreement <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {complianceData?.status?.agreementStatus === "completed" &&
                  complianceData?.status?.kycStatus === "pending" && (
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
                            window.open(complianceData?.kycUrl, "_blank");
                          }}
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
                    {/* Add loading indicator */}
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-background/80 z-10"
                      id="iframe-loader"
                    >
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                    <iframe
                      ref={iframeRef}
                      src={complianceData?.agreementUrl}
                      className="w-full h-full border-0"
                      title="Compliance Agreement"
                      width="100%"
                      height="100%"
                      onLoad={() => {
                        const loader = document.getElementById("iframe-loader");
                        if (loader) loader.style.display = "none";
                      }}
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
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
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
                            <FormLabel>Last Name</FormLabel>
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
                            <FormLabel>Beneficiary Type</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/DD/YYYY" {...field} />
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
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" {...field} />
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
                            <FormLabel>City</FormLabel>
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
                            <FormLabel>State</FormLabel>
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
                            <FormLabel>Postcode</FormLabel>
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
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="US" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input placeholder="US" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+12125551234" {...field} />
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
                            <FormLabel>SSN</FormLabel>
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
