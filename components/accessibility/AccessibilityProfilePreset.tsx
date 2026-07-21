"use client";

import React from "react";

import { useAccessibilityPreferences } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { ACCESSIBILITY_PRESETS } from "@/lib/accessibility/ui-preferences";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { AccessibilityPresetId } from "@/types/accessibility-ui";

export function AccessibilityProfilePreset({
  presetId,
}: {
  presetId: AccessibilityPresetId;
}) {
  const { applyPreset, activePresetId } = useAccessibilityPreferences();
  const preset = ACCESSIBILITY_PRESETS[presetId];
  const isActive = activePresetId === presetId;

  return (
    <button
      type="button"
      className={`flex min-h-11 w-full flex-col items-start rounded-xl border px-3 py-3 text-left transition ${
        isActive
          ? "border-[#005B7F] bg-[#005B7F]/10"
          : "border-slate-200 bg-white hover:bg-slate-50"
      } ${mapableCareFocusRing}`}
      onClick={() => applyPreset(presetId)}
      aria-pressed={isActive}
    >
      <span className="text-sm font-black text-[#0C1833]">{preset.label}</span>
      <span className="mt-1 text-xs leading-5 text-slate-600">
        {preset.description}
      </span>
      <span className="mt-2 text-xs font-bold text-[#005B7F]">
        {isActive ? "Currently matching" : "Apply"}
      </span>
    </button>
  );
}
