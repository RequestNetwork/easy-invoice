"use client";

import { InvoiceMeLink } from "@/app/(dashboard)/invoices/me/_components/invoice-me-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InvoiceMe } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useState } from "react";

interface InvoiceMeLinksProps {
  initialLinks: InvoiceMe[];
}

export function InvoiceMeLinks({ initialLinks }: InvoiceMeLinksProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const trpcContext = api.useUtils();

  const { data: links } = api.invoiceMe.getAll.useQuery(undefined, {
    initialData: initialLinks,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const {
    mutateAsync: createInvoiceMeLink,
    isLoading: isCreatingInvoiceMeLink,
  } = api.invoiceMe.create.useMutation({
    onSuccess: () => {
      trpcContext.invoiceMe.getAll.invalidate();
    },
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateInvoiceMeLink = async () => {
    if (newLinkName.length === 0) {
      setError("Link label is required");
      return;
    }
    await createInvoiceMeLink({ label: newLinkName });
    setIsCreating(false);
    setNewLinkName("");
    setError(null);
  };

  return (
    <main className="flex-grow flex flex-col max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 gap-8">
        <h1 className="text-3xl font-bold tracking-tight">Your links</h1>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md px-4 py-2 text-sm font-medium"
        >
          + New Link
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-grow space-y-2">
                <Label htmlFor="newLinkName">Link label</Label>
                <Input
                  id="newLinkName"
                  placeholder="e.g. Project X"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      await handleCreateInvoiceMeLink();
                    }
                  }}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
              <Button
                onClick={async () => {
                  await handleCreateInvoiceMeLink();
                }}
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
                disabled={isCreatingInvoiceMeLink}
              >
                {isCreatingInvoiceMeLink ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {links.map((link) => (
          <InvoiceMeLink key={link.id} link={link} origin={origin} />
        ))}
      </div>
    </main>
  );
}
