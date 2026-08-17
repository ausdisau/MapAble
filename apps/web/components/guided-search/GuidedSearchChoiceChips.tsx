import React from "react";

import { cn } from "@/app/lib/utils";
import type { ClarificationChoice } from "@/lib/copilot/types";

type Props = {
  choices: ClarificationChoice[];
  onSelect: (choice: ClarificationChoice) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
};

export function GuidedSearchChoiceChips({
  choices,
  onSelect,
  disabled = false,
  className,
  compact = false,
}: Props) {
  if (choices.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Suggested answers"
    >
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(choice)}
          className={cn(
            "rounded-full border border-slate-200 bg-white font-bold text-[#0C1833] transition hover:border-[#005B7F]/40 hover:bg-[#F8C51C]/20 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50",
            compact ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm",
          )}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
