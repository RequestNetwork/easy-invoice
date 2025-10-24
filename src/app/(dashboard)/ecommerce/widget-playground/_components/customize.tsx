"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CurrencyCombobox } from "./currency-combobox";
import type { PlaygroundFormData } from "./validation";

const EASY_INVOICE_URL = process.env.NEXT_PUBLIC_APP_URL;

export const CustomizeForm = () => {
  const {
    control,
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<PlaygroundFormData>();

  const formValues = watch();

  const addInvoiceItem = () => {
    const currentItems = formValues.receiptInfo.items;
    const newItem = {
      id: (currentItems.length + 1).toString(),
      description: "",
      quantity: 1,
      unitPrice: "0",
      total: "0",
      currency: "USD",
    };
    setValue("receiptInfo.items", [...currentItems, newItem]);
  };

  const removeInvoiceItem = (index: number) => {
    const currentItems = formValues.receiptInfo.items;
    if (currentItems.length > 1) {
      setValue(
        "receiptInfo.items",
        currentItems.filter((_, i) => i !== index),
      );
    }
  };

  const updateItemTotal = (index: number) => {
    const items = formValues.receiptInfo.items;
    const item = items[index];
    const quantity =
      typeof item.quantity === "string"
        ? Number.parseFloat(item.quantity) || 0
        : item.quantity;
    const unitPrice =
      typeof item.unitPrice === "string"
        ? Number.parseFloat(item.unitPrice) || 0
        : item.unitPrice;
    const total = quantity * unitPrice;
    setValue(`receiptInfo.items.${index}.total`, total.toString());
  };

  // Auto-calculate totals when items change
  useEffect(() => {
    const items = formValues.receiptInfo.items;
    const subtotal = items.reduce((sum, item) => {
      const total =
        typeof item.total === "string"
          ? Number.parseFloat(item.total) || 0
          : item.total;
      return sum + total;
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
      if (item.discount) {
        const discount =
          typeof item.discount === "string"
            ? Number.parseFloat(item.discount) || 0
            : item.discount;
        return sum + discount;
      }
      return sum;
    }, 0);

    const totalTax = items.reduce((sum, item) => {
      if (item.tax) {
        const tax =
          typeof item.tax === "string"
            ? Number.parseFloat(item.tax) || 0
            : item.tax;
        return sum + tax;
      }
      return sum;
    }, 0);

    const total = subtotal - totalDiscount + totalTax;

    setValue("receiptInfo.totals", {
      totalDiscount: totalDiscount.toString(),
      totalTax: totalTax.toString(),
      total: total.toString(),
      totalUSD: total.toString(),
    });

    // Update the payment amount
    setValue("amountInUsd", total.toString());
  }, [formValues.receiptInfo.items, setValue]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Payment Configuration</h2>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center">
          Recipient Wallet Address
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          placeholder="0x1234567890123456789012345678901234567890"
          {...register("recipientWallet")}
          className={cn(errors.recipientWallet && "border-destructive")}
        />
        {errors.recipientWallet?.message && (
          <FormError>{errors.recipientWallet.message}</FormError>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center">
          Request Network API Client ID
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          placeholder="your-api-client-id"
          {...register("paymentConfig.rnApiClientId")}
          className={cn(
            errors.paymentConfig?.rnApiClientId && "border-destructive",
          )}
        />
        {errors.paymentConfig?.rnApiClientId?.message && (
          <FormError>{errors.paymentConfig.rnApiClientId.message}</FormError>
        )}
        <p className="text-sm text-muted-foreground">
          Get your Client ID on{" "}
          <a
            href={`${EASY_INVOICE_URL}/ecommerce/manage`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            EasyInvoice
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>WalletConnect Project ID (Optional)</Label>
        <Input
          placeholder="your-walletconnect-project-id"
          {...register("paymentConfig.walletConnectProjectId")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Custom payment reference (Optional)</Label>
        <Input
          placeholder="your-custom-payment-reference"
          {...register("paymentConfig.reference")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center">
          Supported Currencies
          <span className="text-destructive ml-1">*</span>
        </Label>
        <FormField
          control={control}
          name="paymentConfig.supportedCurrencies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accepted Currencies</FormLabel>
              <FormControl>
                <CurrencyCombobox
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Select which currencies you want to accept for payments
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Fee Address</Label>
        <Input
          placeholder="0x1234567890123456789012345678901234567890"
          {...register("paymentConfig.feeInfo.feeAddress")}
        />
        <Label>Fee Percentage</Label>
        <Input
          placeholder="2.5"
          {...register("paymentConfig.feeInfo.feePercentage")}
        />
      </div>

      <h2 className="text-xl font-semibold text-foreground mt-4">
        Invoice Items
      </h2>

      {formValues.receiptInfo.items.map((item, index) => (
        <div
          key={item.id}
          className="border border-border rounded-lg p-4 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Item {index + 1}</h4>
            {formValues.receiptInfo.items.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeInvoiceItem(index)}
              >
                Remove
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Service/Product description"
                {...register(`receiptInfo.items.${index}.description`)}
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="1"
                {...register(`receiptInfo.items.${index}.quantity`, {
                  valueAsNumber: true,
                  onChange: () => updateItemTotal(index),
                })}
              />
            </div>
            <div>
              <Label>Unit Price (USD)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register(`receiptInfo.items.${index}.unitPrice`, {
                  onChange: () => updateItemTotal(index),
                })}
              />
            </div>
            <div>
              <Label>Total</Label>
              <Input
                type="number"
                step="0.01"
                readOnly
                value={
                  typeof item.total === "string"
                    ? Number.parseFloat(item.total) || 0
                    : item.total
                }
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addInvoiceItem}>
        Add Item
      </Button>

      <h2 className="text-xl font-semibold text-foreground mt-4">
        UI Configuration
      </h2>

      {/* UI Config */}
      <div className="flex items-center justify-between">
        <Label>Show Request Scan URL</Label>
        <Switch
          checked={formValues.uiConfig?.showRequestScanUrl || false}
          onCheckedChange={(checked) =>
            setValue("uiConfig.showRequestScanUrl", checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Receipt Download</Label>
        <Switch
          checked={formValues.uiConfig?.showReceiptDownload || false}
          onCheckedChange={(checked) =>
            setValue("uiConfig.showReceiptDownload", checked)
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Receipt Number</Label>
        <Input
          placeholder="REC-001"
          {...register("receiptInfo.invoiceNumber")}
        />
      </div>

      {/* Totals Display */}
      <div className="border-t border-border pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span>
              $
              {(
                Number.parseFloat(formValues.receiptInfo.totals.total) || 0
              ).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount:</span>
            <span>
              -$
              {(
                Number.parseFloat(
                  formValues.receiptInfo.totals.totalDiscount,
                ) || 0
              ).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax:</span>
            <span>
              $
              {(
                Number.parseFloat(formValues.receiptInfo.totals.totalTax) || 0
              ).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
            <span>Total:</span>
            <span>
              $
              {(
                Number.parseFloat(formValues.receiptInfo.totals.totalUSD) || 0
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
