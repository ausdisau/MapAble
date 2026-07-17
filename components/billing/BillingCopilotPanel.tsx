"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableSectionCardClass } from "@/lib/brand/styles";
import { cn } from "@/app/lib/utils";
import type { BillingCopilotSuggestion } from "@/types/billing";

const UNCERTAINTY_LABEL: Record<
  BillingCopilotSuggestion["uncertainty"],
  string
> = {
  low: "Low uncertainty — still verify before acting",
  medium: "Medium uncertainty — review carefully",
  high: "High uncertainty — treat as a draft only",
};

export function BillingCopilotPanel({
  suggestion,
  onConfirm,
  className,
}: {
  suggestion: BillingCopilotSuggestion | null;
  onConfirm?: (suggestionId: string) => void;
  className?: string;
}) {
  const checkboxId = useId();
  const [acknowledged, setAcknowledged] = useState(false);
  const [edited, setEdited] = useState(false);
  const [draftBody, setDraftBody] = useState(suggestion?.body ?? "");

  if (!suggestion) {
    return (
      <aside
        aria-label="Billing copilot suggestions"
        className={cn(mapableSectionCardClass, "p-5", className)}
      >
        <h2 className="text-lg font-black text-[#0C1833]">Billing assistant</h2>
        <p className="mt-2 text-sm text-slate-600">
          No suggestion available. Copilot drafts never apply financial changes
          without your confirmation.
        </p>
      </aside>
    );
  }

  const canConfirm = acknowledged && edited;

  return (
    <aside
      aria-label="Billing copilot suggestion"
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <h2 className="text-lg font-black text-[#0C1833]">Billing assistant</h2>
      <p className="mt-1 text-sm font-semibold text-[#005B7F]">
        {suggestion.title}
      </p>

      <p
        className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        role="status"
      >
        <span className="font-semibold">Uncertainty: </span>
        {UNCERTAINTY_LABEL[suggestion.uncertainty]}
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor={`${checkboxId}-body`}>
        Editable draft (required)
      </label>
      <textarea
        id={`${checkboxId}-body`}
        className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-[#0C1833] shadow-sm outline-none focus-visible:border-[#005B7F]/40 focus-visible:ring-4 focus-visible:ring-[#F8C51C]/30"
        value={draftBody}
        onChange={(e) => {
          setDraftBody(e.target.value);
          setEdited(true);
        }}
      />

      {suggestion.citations.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-black text-[#0C1833]">Citations</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {suggestion.citations.map((c) => (
              <li key={`${c.entityType}-${c.entityId}`}>
                {c.label}{" "}
                <span className="text-xs text-slate-500">
                  ({c.entityType}:{c.entityId})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-2">
        <input
          id={checkboxId}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#005B7F] focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <label htmlFor={checkboxId} className="text-sm text-slate-700">
          I have reviewed and edited this suggestion. I understand MapAble will
          not apply it until I confirm.
        </label>
      </div>

      <Button
        type="button"
        variant="default"
        size="default"
        className="mt-4"
        disabled={!canConfirm}
        aria-disabled={!canConfirm}
        onClick={() => onConfirm?.(suggestion.id)}
      >
        Confirm suggestion
      </Button>
      {!canConfirm ? (
        <p className="mt-2 text-xs text-slate-500">
          Confirm stays disabled until you edit the draft and tick the
          acknowledgment.
        </p>
      ) : null}
    </aside>
  );
}
