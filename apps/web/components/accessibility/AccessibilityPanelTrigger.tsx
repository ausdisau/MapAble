"use client";

import React, { useRef } from "react";

import { useAccessibilityPreferencesOptional } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AccessibilityPanelTrigger({
  variant = "button",
  className = "",
  showLabel = true,
}: {
  variant?: "button" | "link";
  className?: string;
  showLabel?: boolean;
}) {
  const a11y = useAccessibilityPreferencesOptional();
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  if (!a11y) return null;

  const adjusted = a11y.hasCustomPreferences;
  const label = "Open accessibility settings";
  const visible = showLabel ? "Accessibility" : null;

  if (variant === "link") {
    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        className={`min-h-11 rounded-lg text-sm font-medium text-slate-600 underline-offset-2 hover:text-[#005B7F] hover:underline ${mapableCareFocusRing} ${className}`}
        aria-label={label}
        aria-expanded={a11y.isPanelOpen}
        aria-haspopup="dialog"
        onClick={() => a11y.openPanel(ref.current)}
      >
        {visible ?? "Accessibility settings"}
        {adjusted ? (
          <span className="sr-only"> (custom display settings active)</span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border-2 border-[#0C1833] px-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing} ${className}`}
      aria-label={label}
      aria-expanded={a11y.isPanelOpen}
      aria-haspopup="dialog"
      onClick={() => a11y.openPanel(ref.current)}
    >
      <span aria-hidden="true" className="text-base leading-none">
        A
      </span>
      {showLabel ? (
        <span className="hidden sm:inline">
          Accessibility
          {adjusted ? (
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-[#005B7F]" aria-hidden="true" />
          ) : null}
        </span>
      ) : null}
      {adjusted ? (
        <span className="sr-only"> (custom display settings active)</span>
      ) : null}
    </button>
  );
}
