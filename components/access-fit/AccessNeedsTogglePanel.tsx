import React from "react";

import type { AccessNeed } from "@/lib/access/fit/types";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const ACCESS_NEED_FIELD_LABELS: { key: keyof AccessNeed; label: string }[] = [
  { key: "wheelchairUser", label: "I use a wheelchair" },
  { key: "powerchairUser", label: "I use a powerchair" },
  { key: "stepFreeRequired", label: "Step-free access required" },
  { key: "accessibleToiletRequired", label: "Accessible toilet required" },
  { key: "lowSensoryNeeded", label: "Low sensory / quiet needed" },
  { key: "hearingLoopNeeded", label: "Hearing loop needed" },
  { key: "AuslanNeeded", label: "Auslan support needed" },
  { key: "AACFriendlyNeeded", label: "AAC-friendly communication needed" },
  { key: "assistanceAnimal", label: "Assistance animal" },
  { key: "accessibleParkingNeeded", label: "Accessible parking needed" },
  { key: "dropOffNeeded", label: "Drop-off point needed" },
  { key: "transportSupportNeeded", label: "Transport support needed" },
  { key: "fatigueBufferNeeded", label: "Extra time / fatigue buffer needed" },
];

export function AccessNeedsTogglePanel({
  needs,
  onChange,
}: {
  needs: AccessNeed;
  onChange: (next: AccessNeed) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-[#0C1833]">
        Demo access needs (stored on this device only)
      </legend>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ACCESS_NEED_FIELD_LABELS.map(({ key, label }) => (
          <li key={key}>
            <label
              className={`flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm text-slate-700 ${mapableInteractiveFocusRing}`}
            >
              <input
                type="checkbox"
                className={`h-4 w-4 rounded border-slate-300 ${mapableInteractiveFocusRing}`}
                checked={needs[key]}
                onChange={(event) =>
                  onChange({
                    ...needs,
                    [key]: event.target.checked,
                  })
                }
              />
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
