import React from "react";

import { cn } from "@/app/lib/utils";
import type { ClarificationSlot } from "@/lib/copilot/types";

const SLOT_LABELS: Record<Exclude<ClarificationSlot, "general">, string> = {
  location: "Location",
  service: "Support",
  access: "Access",
};

type Props = {
  filledSlots?: Partial<Record<ClarificationSlot, boolean>>;
  className?: string;
  compact?: boolean;
};

export function GuidedSearchSlotProgress({
  filledSlots,
  className,
  compact = false,
}: Props) {
  const slots = (["location", "service", "access"] as const).map((slot) => ({
    slot,
    label: SLOT_LABELS[slot],
    filled: Boolean(filledSlots?.[slot]),
  }));

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        compact ? "text-[10px]" : "text-xs",
        className,
      )}
      aria-label="Search details collected"
    >
      {slots.map(({ slot, label, filled }) => (
        <span
          key={slot}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
            filled
              ? "bg-[#005B7F]/15 text-[#005B7F]"
              : "border border-slate-200 bg-white text-slate-500",
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              filled ? "bg-[#005B7F]" : "bg-slate-300",
            )}
            aria-hidden
          />
          {label}
        </span>
      ))}
    </div>
  );
}
