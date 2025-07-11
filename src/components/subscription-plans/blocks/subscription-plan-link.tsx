"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import type { SubscriptionPlan } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SubscriptionPlanLinkProps {
  plan: SubscriptionPlan;
}

export function SubscriptionPlanLink({ plan }: SubscriptionPlanLinkProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trpcContext = api.useUtils();
  const { mutateAsync: deleteSubscriptionPlan } =
    api.subscriptionPlan.delete.useMutation({
      onSuccess: () => {
        trpcContext.subscriptionPlan.getAll.invalidate();
      },
    });

  const linkUrl = `${origin}/s/${plan.id}`;

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const displayCurrency = formatCurrencyLabel(plan.paymentCurrency);

  return (
    <Card className="overflow-hidden bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h3 className="font-bold text-zinc-900">{plan.label}</h3>
            <p className="text-sm text-zinc-600">
              {plan.amount} {displayCurrency} · {plan.recurrenceFrequency}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyLink(linkUrl)}
              className="h-8 w-8 p-0 hover:bg-zinc-100"
              title="Copy link"
            >
              <Copy className="h-4 w-4 text-zinc-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0 hover:bg-zinc-100"
              title="Open link"
            >
              <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 text-zinc-600" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Delete subscription plan"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this subscription plan? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await deleteSubscriptionPlan(plan.id);
                        toast.success("Subscription plan deleted");
                      } catch (error) {
                        console.error(error);
                        toast.error("Failed to delete subscription plan", {
                          description:
                            "Please try again later or contact support if the problem persists.",
                        });
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
