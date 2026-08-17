"use client";

import React, { useState } from "react";

import { cn } from "@/app/lib/utils";

type SuggestedSearchChipsProps = {
  suggestions: readonly string[];
  onSelect: (suggestion: string) => void;
  className?: string;
};

export function SuggestedSearchChips({
  suggestions,
  onSelect,
  className,
}: SuggestedSearchChipsProps) {
  const [announcement, setAnnouncement] = useState("");

  function selectChip(text: string) {
    onSelect(text);
    setAnnouncement(`Search updated to ${text}.`);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-muted-foreground">
        Try a suggested search
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => selectChip(suggestion)}
            aria-label={`Use suggested search: ${suggestion}`}
            className="max-w-full rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs font-medium text-primary transition hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
