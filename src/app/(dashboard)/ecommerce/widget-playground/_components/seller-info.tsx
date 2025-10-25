"use client";

import { FormError } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import type { PlaygroundFormData } from "./validation";

export const SellerForm = () => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<PlaygroundFormData>();

  const addressFields = watch([
    "receiptInfo.companyInfo.address.street",
    "receiptInfo.companyInfo.address.city",
    "receiptInfo.companyInfo.address.state",
    "receiptInfo.companyInfo.address.postalCode",
    "receiptInfo.companyInfo.address.country",
  ]);

  const hasAnyAddressField = addressFields.some(
    (field) => field && field.trim() !== "",
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">
        Company Information
      </h2>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center">
          Company Name
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          placeholder="ACME Corp"
          {...register("receiptInfo.companyInfo.name")}
          className={cn(
            errors.receiptInfo?.companyInfo?.name && "border-destructive",
          )}
        />
        {errors.receiptInfo?.companyInfo?.name?.message && (
          <FormError>{errors.receiptInfo.companyInfo.name.message}</FormError>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tax ID</Label>
        <Input
          placeholder="ACME1234567"
          {...register("receiptInfo.companyInfo.taxId")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Email</Label>
        <Input
          placeholder="company@example.com"
          {...register("receiptInfo.companyInfo.email")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Phone</Label>
        <Input
          placeholder="+1234567890"
          {...register("receiptInfo.companyInfo.phone")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Website</Label>
        <Input
          placeholder="https://example.com"
          {...register("receiptInfo.companyInfo.website")}
        />
      </div>

      <h2 className="text-xl font-semibold text-foreground mt-4">
        Company Address
      </h2>

      <div className="flex flex-col gap-2">
        <Label>
          Street Address
          {hasAnyAddressField && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
        <Input
          placeholder="123 Main St"
          {...register("receiptInfo.companyInfo.address.street", {
            required: hasAnyAddressField
              ? "Street address is required when any address field is filled"
              : false,
          })}
          className={cn(
            errors.receiptInfo?.companyInfo?.address?.street &&
              "border-destructive",
          )}
        />
        {errors.receiptInfo?.companyInfo?.address?.street?.message && (
          <FormError>
            {errors.receiptInfo.companyInfo.address.street.message}
          </FormError>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            City
            {hasAnyAddressField && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            placeholder="New York"
            {...register("receiptInfo.companyInfo.address.city", {
              required: hasAnyAddressField
                ? "City is required when any address field is filled"
                : false,
            })}
            className={cn(
              errors.receiptInfo?.companyInfo?.address?.city &&
                "border-destructive",
            )}
          />
          {errors.receiptInfo?.companyInfo?.address?.city?.message && (
            <FormError>
              {errors.receiptInfo.companyInfo.address.city.message}
            </FormError>
          )}
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            State/Province
            {hasAnyAddressField && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            placeholder="NY"
            {...register("receiptInfo.companyInfo.address.state", {
              required: hasAnyAddressField
                ? "State is required when any address field is filled"
                : false,
            })}
            className={cn(
              errors.receiptInfo?.companyInfo?.address?.state &&
                "border-destructive",
            )}
          />
          {errors.receiptInfo?.companyInfo?.address?.state?.message && (
            <FormError>
              {errors.receiptInfo.companyInfo.address.state.message}
            </FormError>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            Zip Code
            {hasAnyAddressField && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            placeholder="10001"
            {...register("receiptInfo.companyInfo.address.postalCode", {
              required: hasAnyAddressField
                ? "Zip code is required when any address field is filled"
                : false,
            })}
            className={cn(
              errors.receiptInfo?.companyInfo?.address?.postalCode &&
                "border-destructive",
            )}
          />
          {errors.receiptInfo?.companyInfo?.address?.postalCode?.message && (
            <FormError>
              {errors.receiptInfo.companyInfo.address.postalCode.message}
            </FormError>
          )}
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <Label>
            Country
            {hasAnyAddressField && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            placeholder="USA"
            {...register("receiptInfo.companyInfo.address.country", {
              required: hasAnyAddressField
                ? "Country is required when any address field is filled"
                : false,
            })}
            className={cn(
              errors.receiptInfo?.companyInfo?.address?.country &&
                "border-destructive",
            )}
          />
          {errors.receiptInfo?.companyInfo?.address?.country?.message && (
            <FormError>
              {errors.receiptInfo.companyInfo.address.country.message}
            </FormError>
          )}
        </div>
      </div>
    </section>
  );
};
