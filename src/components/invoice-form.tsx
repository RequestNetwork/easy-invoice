"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  formatCurrencyLabel,
  getPaymentCurrenciesForInvoice,
} from "@/lib/currencies";
import type { InvoiceFormValues } from "@/lib/schemas/invoice";
import { Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

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
  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-black hover:bg-zinc-800 text-white transition-colors"
          disabled={isLoading || form.formState.isSubmitSuccessful}
        >
          {isLoading
            ? "Creating..."
            : form.formState.isSubmitSuccessful
              ? "Invoice created"
              : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
