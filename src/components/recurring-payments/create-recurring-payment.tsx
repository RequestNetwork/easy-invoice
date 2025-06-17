"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function CreateRecurringPayment() {
  return (
    <div className="flex justify-center mx-auto w-full max-w-6xl">
      <Card className="w-full shadow-lg border-zinc-200/80">
        <CardHeader className="bg-zinc-50 rounded-t-lg border-b border-zinc-200/80">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Recurring Payment
          </CardTitle>
        </CardHeader>

        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-zinc-500">Create a new recurring payment</p>
            <p className="text-zinc-400 text-sm">
              Set up automated payments to recipients
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
