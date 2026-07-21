"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Option<T extends string | number | boolean> = {
  value: T;
  label: string;
};

export function AccessibilityAdjustmentControl<
  T extends string | number | boolean,
>({
  id,
  label,
  description,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 p-3">
      <legend className="px-1 text-sm font-semibold text-[#0C1833]">{label}</legend>
      {description ? (
        <p id={`${id}-desc`} className="mt-1 text-xs text-slate-600">
          {description}
        </p>
      ) : null}
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="radiogroup"
        aria-describedby={description ? `${id}-desc` : undefined}
      >
        {options.map((option) => {
          const selected = option.value === value;
          const optionId = `${id}-${String(option.value)}`;
          return (
            <label
              key={String(option.value)}
              htmlFor={optionId}
              className={`relative inline-flex min-h-11 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold ${
                selected
                  ? "border-[#005B7F] bg-[#005B7F] text-white"
                  : "border-slate-300 bg-white text-[#0C1833]"
              } ${mapableCareFocusRing}`}
            >
              <input
                id={optionId}
                type="radio"
                className="absolute inset-0 cursor-pointer opacity-0"
                name={id}
                value={String(option.value)}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AccessibilityToggleControl({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 ${mapableCareFocusRing}`}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold text-[#0C1833]">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs text-slate-600">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
