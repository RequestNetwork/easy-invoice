"use client";

import { useFormContext } from "react-hook-form";
import type { PlaygroundFormData } from "./validation";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form";

export const BuyerForm = () => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<PlaygroundFormData>();

  const addressFields = watch([
    "receiptInfo.buyerInfo.address.street",
    "receiptInfo.buyerInfo.address.city",
    "receiptInfo.buyerInfo.address.state",
    "receiptInfo.buyerInfo.address.country",
    "receiptInfo.buyerInfo.address.postalCode",
  ]);

  const hasAnyAddressField = addressFields.some(
    (field) => field && field.trim() !== "",
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">
        Buyer Information
      </h2>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2 w-1/2">
          <Label>First Name</Label>
          <Input
            placeholder="Jane"
            {...register("receiptInfo.buyerInfo.firstName")}
          />
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <Label>Last Name</Label>
          <Input
            placeholder="Smith"
            {...register("receiptInfo.buyerInfo.lastName")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Business Name</Label>
        <Input
          placeholder="XYZ Corp"
          {...register("receiptInfo.buyerInfo.businessName")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Email</Label>
        <Input
          placeholder="buyer@example.com"
          {...register("receiptInfo.buyerInfo.email")}
          className={cn(
            "border-2",
            errors.receiptInfo?.buyerInfo?.email
              ? "border-red-500"
              : "border-gray-200",
          )}
        />
        {errors.receiptInfo?.buyerInfo?.email?.message && (
          <FormError>{errors.receiptInfo.buyerInfo.email.message}</FormError>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Phone</Label>
        <Input
          placeholder="+1234567890"
          {...register("receiptInfo.buyerInfo.phone")}
        />
      </div>

      <h2 className="text-xl font-semibold text-foreground mt-4">
        Buyer Address
      </h2>

      <div className="flex flex-col gap-2">
        <Label>
          Street Address
          {hasAnyAddressField && <span className="text-red-500">*</span>}
        </Label>
        <Input
          placeholder="456 Elm St"
          {...register("receiptInfo.buyerInfo.address.street", {
            required: hasAnyAddressField
              ? "Street address is required when any address field is filled"
              : false,
          })}
          className={cn(
            "border-2",
            errors.receiptInfo?.buyerInfo?.address?.street
              ? "border-red-500"
              : "border-gray-200",
          )}
        />
        {errors.receiptInfo?.buyerInfo?.address?.street?.message && (
          <FormError>
            {errors.receiptInfo.buyerInfo.address.street.message}
          </FormError>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            City
            {hasAnyAddressField && <span className="text-red-500">*</span>}
          </Label>
          <Input
            placeholder="Los Angeles"
            {...register("receiptInfo.buyerInfo.address.city", {
              required: hasAnyAddressField
                ? "City is required when any address field is filled"
                : false,
            })}
            className={cn(
              "border-2",
              errors.receiptInfo?.buyerInfo?.address?.city
                ? "border-red-500"
                : "border-gray-200",
            )}
          />
          {errors.receiptInfo?.buyerInfo?.address?.city?.message && (
            <FormError>
              {errors.receiptInfo.buyerInfo.address.city.message}
            </FormError>
          )}
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            State/Province
            {hasAnyAddressField && <span className="text-red-500">*</span>}
          </Label>
          <Input
            placeholder="CA"
            {...register("receiptInfo.buyerInfo.address.state", {
              required: hasAnyAddressField
                ? "State is required when any address field is filled"
                : false,
            })}
            className={cn(
              "border-2",
              errors.receiptInfo?.buyerInfo?.address?.state
                ? "border-red-500"
                : "border-gray-200",
            )}
          />
          {errors.receiptInfo?.buyerInfo?.address?.state?.message && (
            <FormError>
              {errors.receiptInfo.buyerInfo.address.state.message}
            </FormError>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            Postal Code
            {hasAnyAddressField && <span className="text-red-500">*</span>}
          </Label>
          <Input
            placeholder="90001"
            {...register("receiptInfo.buyerInfo.address.postalCode", {
              required: hasAnyAddressField
                ? "Postal code is required when any address field is filled"
                : false,
            })}
            className={cn(
              "border-2",
              errors.receiptInfo?.buyerInfo?.address?.postalCode
                ? "border-red-500"
                : "border-gray-200",
            )}
          />
          {errors.receiptInfo?.buyerInfo?.address?.postalCode?.message && (
            <FormError>
              {errors.receiptInfo.buyerInfo.address.postalCode.message}
            </FormError>
          )}
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            Country
            {hasAnyAddressField && <span className="text-red-500">*</span>}
          </Label>
          <Input
            placeholder="USA"
            {...register("receiptInfo.buyerInfo.address.country", {
              required: hasAnyAddressField
                ? "Country is required when any address field is filled"
                : false,
            })}
            className={cn(
              "border-2",
              errors.receiptInfo?.buyerInfo?.address?.country
                ? "border-red-500"
                : "border-gray-200",
            )}
          />
          {errors.receiptInfo?.buyerInfo?.address?.country?.message && (
            <FormError>
              {errors.receiptInfo.buyerInfo.address.country.message}
            </FormError>
          )}
        </div>
      </div>
    </section>
  );
};
