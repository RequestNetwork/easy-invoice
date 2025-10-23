"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuyerInfo } from "../types";

interface BuyerInfoProps {
  initialData?: BuyerInfo;
  onBack: () => void;
  onSubmit: (data: BuyerInfo) => void;
}

export function BuyerInfoForm({
  initialData,
  onBack,
  onSubmit,
}: BuyerInfoProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BuyerInfo>({
    defaultValues: initialData || {},
  });

  // Watch all address fields to determine if any have values
  const addressFields = watch([
    "address.street",
    "address.city",
    "address.state",
    "address.country",
    "address.postalCode",
  ]);

  const hasAnyAddressField = addressFields.some(
    (field) => field && field.trim() !== "",
  );

  const onFormSubmit = (data: BuyerInfo) => {
    const cleanValue = (value: string | undefined) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? undefined : trimmed;
      }
      return value;
    };

    // we want to send undefined for empty optional fields
    const cleanData: BuyerInfo = {
      email: data.email,
      firstName: cleanValue(data.firstName),
      lastName: cleanValue(data.lastName),
      businessName: cleanValue(data.businessName),
      phone: cleanValue(data.phone),
      address: data.address && hasAnyAddressField ? data.address : undefined,
    };

    onSubmit(cleanData);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Buyer Information</h3>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Please enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <span className="text-sm text-destructive">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Doe" {...register("lastName")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              placeholder="Acme Inc."
              {...register("businessName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address.street">
              Street Address
              {hasAnyAddressField && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="address.street"
              placeholder="123 Main St, Apt 4B"
              {...register("address.street", {
                required: hasAnyAddressField
                  ? "Street address is required when address is provided"
                  : false,
              })}
            />
            {errors.address?.street && (
              <span className="text-sm text-destructive">
                {errors.address.street.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.city">
                City
                {hasAnyAddressField && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="address.city"
                placeholder="San Francisco"
                {...register("address.city", {
                  required: hasAnyAddressField
                    ? "City is required when address is provided"
                    : false,
                })}
              />
              {errors.address?.city && (
                <span className="text-sm text-destructive">
                  {errors.address.city.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.state">
                State/Province
                {hasAnyAddressField && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="address.state"
                placeholder="CA"
                {...register("address.state", {
                  required: hasAnyAddressField
                    ? "State/Province is required when address is provided"
                    : false,
                })}
              />
              {errors.address?.state && (
                <span className="text-sm text-destructive">
                  {errors.address.state.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.country">
                Country
                {hasAnyAddressField && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="address.country"
                placeholder="US"
                {...register("address.country", {
                  required: hasAnyAddressField
                    ? "Country is required when address is provided"
                    : false,
                  pattern: hasAnyAddressField
                    ? {
                        value: /^[A-Z]{2}$/,
                        message:
                          "Use a 2-letter ISO country code (e.g. US, CA, GB)",
                      }
                    : undefined,
                })}
              />
              {errors.address?.country && (
                <span className="text-sm text-destructive">
                  {errors.address.country.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.postalCode">
                Postal Code
                {hasAnyAddressField && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="address.postalCode"
                placeholder="94105"
                {...register("address.postalCode", {
                  required: hasAnyAddressField
                    ? "Postal code is required when address is provided"
                    : false,
                })}
              />
              {errors.address?.postalCode && (
                <span className="text-sm text-destructive">
                  {errors.address.postalCode.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {hasAnyAddressField && (
          <div className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> All address fields are
            required when providing an address
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue to Payment
          </Button>
        </div>
      </form>
    </div>
  );
}
