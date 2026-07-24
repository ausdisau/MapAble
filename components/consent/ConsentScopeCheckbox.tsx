"use client";

import { useId } from "react";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type ConsentScopeOption = {
  id: string;
  label: string;
  description?: string;
};

type ConsentScopeCheckboxProps = {
  scopes: ConsentScopeOption[];
  checkedIds: string[];
  onChange: (nextIds: string[]) => void;
  legend?: string;
  error?: string;
  requiredScopeIds?: string[];
  className?: string;
};

/**
 * Modular consent checkboxes that record explicit sharing scopes before submit.
 */
export function ConsentScopeCheckbox({
  scopes,
  checkedIds,
  onChange,
  legend = "Data sharing consent",
  error,
  requiredScopeIds = [],
  className,
}: ConsentScopeCheckboxProps) {
  const baseId = useId();
  const errorId = `${baseId}-error`;

  function toggle(id: string) {
    onChange(
      checkedIds.includes(id)
        ? checkedIds.filter((item) => item !== id)
        : [...checkedIds, id],
    );
  }

  return (
    <fieldset
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4",
        error ? "border-red-400" : null,
        className,
      )}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="px-1 text-sm font-black text-[#0C1833]">{legend}</legend>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Only tick scopes you understand. Unticked scopes are not shared.
      </p>
      <ul className="mt-3 space-y-3">
        {scopes.map((scope) => {
          const inputId = `${baseId}-${scope.id}`;
          const required = requiredScopeIds.includes(scope.id);
          return (
            <li key={scope.id}>
              <label
                htmlFor={inputId}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-1 ${mapableCareFocusRing}`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  className={`mt-1 h-4 w-4 rounded border-slate-300 ${mapableCareFocusRing}`}
                  checked={checkedIds.includes(scope.id)}
                  onChange={() => toggle(scope.id)}
                  aria-required={required || undefined}
                />
                <span>
                  <span className="block text-sm font-semibold text-[#0C1833]">
                    {scope.label}
                    {required ? (
                      <span className="sr-only"> (required)</span>
                    ) : null}
                  </span>
                  {scope.description ? (
                    <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                      {scope.description}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p id={errorId} role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export const CONTACT_CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: "contact_response",
    label: "MapAble may use my contact details to respond to this enquiry",
    description: "Name and email only — not for marketing lists.",
  },
  {
    id: "no_sensitive_upload",
    label:
      "I confirm I have not pasted NDIS plan documents or clinical records into this form",
    description: "Use a secure MapAble workflow if those records are required.",
  },
];
