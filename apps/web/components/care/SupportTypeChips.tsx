"use client";

import type { z } from "zod";

import { cn } from "@/app/lib/utils";
import { careRequestTypeSchema } from "@/lib/validation/care";

export type CareRequestTypeValue = z.infer<typeof careRequestTypeSchema>;

export const SUPPORT_TYPE_OPTIONS: {
  value: CareRequestTypeValue;
  label: string;
  description: string;
}[] = [
  {
    value: "personal_care",
    label: "Personal care",
    description: "Showering, dressing, hygiene, mobility at home",
  },
  {
    value: "domestic_assistance",
    label: "Domestic assistance",
    description: "Cleaning, laundry, light home tasks",
  },
  {
    value: "meal_preparation",
    label: "Meal preparation",
    description: "Cooking and meal support",
  },
  {
    value: "community_access",
    label: "Community access",
    description: "Outings, social activities, errands",
  },
  {
    value: "appointment_support",
    label: "Appointment support",
    description: "Attending medical or therapy appointments",
  },
  {
    value: "employment_support",
    label: "Employment support",
    description: "Workplace or job-related support",
  },
  {
    value: "overnight_support",
    label: "Overnight support",
    description: "Night-time presence or assistance",
  },
  {
    value: "other",
    label: "Other support",
    description: "Something else — describe below",
  },
];

export function SupportTypeChips({
  value,
  onChange,
  disabled,
}: {
  value: CareRequestTypeValue;
  onChange: (value: CareRequestTypeValue) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Type of support"
    >
      {SUPPORT_TYPE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer flex-col rounded-xl border p-3 transition",
              selected
                ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15"
                : "border-border/60 bg-card hover:border-primary/25",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="radio"
              name="requestType"
              value={option.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="text-sm font-semibold">{option.label}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {option.description}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function supportTypeLabel(value: string): string {
  return (
    SUPPORT_TYPE_OPTIONS.find((o) => o.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}
