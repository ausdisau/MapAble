import { Check } from "lucide-react";
import React from "react";

const TRUST_ITEMS = [
  "Accessibility-first search",
  "Provider verification shown clearly",
  "Participant-controlled information",
  "NDIS-aware filters",
] as const;

export function SearchTrustRow() {
  return (
    <ul
      className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/50 pt-4"
      aria-label="How MapAble search works"
    >
      {TRUST_ITEMS.map((item) => (
        <li
          key={item}
          className="inline-flex min-h-8 max-w-full items-start gap-2 text-xs text-muted-foreground sm:text-sm"
        >
          <Check
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
