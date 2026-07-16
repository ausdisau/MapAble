"use client";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type GuidanceMode =
  | "standard"
  | "large_text"
  | "plain_language"
  | "high_contrast"
  | "reduced_detail";

type MultimodalModeToggleProps = {
  mode: GuidanceMode;
  onChange: (mode: GuidanceMode) => void;
};

const MODES: Array<{ value: GuidanceMode; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "large_text", label: "Large text" },
  { value: "plain_language", label: "Plain language" },
  { value: "high_contrast", label: "High contrast" },
  { value: "reduced_detail", label: "Reduced detail" },
];

export function MultimodalModeToggle({ mode, onChange }: MultimodalModeToggleProps) {
  const enabled = useIndoorFeatureEnabled("multimodalGuidance");
  if (!enabled) return null;

  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4">
      <legend className="px-1 text-sm font-bold text-[#0C1833]">Guidance mode</legend>
      <p className="mt-1 text-xs text-slate-600">
        All modes use the same route and feature data. Text instructions remain available in every
        mode.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={mode === m.value}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${mapableCareFocusRing} ${
              mode === m.value ? "bg-[#005B7F] text-white" : "border border-slate-300"
            }`}
            onClick={() => onChange(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function guidanceModeClassName(mode: GuidanceMode): string {
  switch (mode) {
    case "large_text":
      return "text-lg leading-relaxed";
    case "plain_language":
      return "text-base leading-relaxed";
    case "high_contrast":
      return "bg-black text-white [&_*]:text-white";
    case "reduced_detail":
      return "text-sm";
    default:
      return "";
  }
}
