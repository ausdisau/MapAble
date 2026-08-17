"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CategorySuggestion } from "@/lib/care/support-category-classifier";

export function ParticipantConfirmationCard({
  categorySuggestions,
  onConfirm,
  confirming,
}: {
  categorySuggestions: CategorySuggestion[];
  onConfirm: () => void;
  confirming?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
      <h3 className="font-semibold">Confirm support categories (draft)</h3>
      <p className="text-sm text-muted-foreground">
        These are draft suggestions only. They are not NDIS eligibility or funding
        decisions. A human may review categories marked for review.
      </p>
      <ul className="space-y-3">
        {categorySuggestions.map((s) => (
          <li
            key={s.supportCategoryCode}
            className="rounded-lg border border-border/60 bg-background p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{s.label}</span>
              {s.requiresHumanReview ? (
                <Badge variant="secondary">Needs review</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-muted-foreground">{s.rationale}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confidence: {Math.round(s.confidence * 100)}%
            </p>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={confirming}
        onClick={onConfirm}
      >
        {confirming ? "Confirming…" : "I confirm these draft categories"}
      </Button>
    </div>
  );
}
