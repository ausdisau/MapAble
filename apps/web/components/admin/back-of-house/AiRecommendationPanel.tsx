"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/back-of-house/AdminConfirmDialog";

export function AiRecommendationPanel({
  plainLanguage,
  technicalDetail,
  onApprove,
  approveLabel = "Approve recommendation",
}: {
  plainLanguage: string;
  technicalDetail?: string | null;
  onApprove?: (auditNote: string) => void | Promise<void>;
  approveLabel?: string;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30"
      aria-labelledby="ai-rec-heading"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="h-5 w-5 text-violet-700" aria-hidden />
        <div className="flex-1">
          <h3 id="ai-rec-heading" className="font-semibold text-violet-950 dark:text-violet-100">
            AI-generated recommendation
          </h3>
          <p className="mt-2 text-sm leading-relaxed">{plainLanguage}</p>
          {technicalDetail ? (
            <div className="mt-3">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Hide technical detail" : "Show technical detail"}
              </button>
              {expanded ? (
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-background/80 p-3 text-xs">
                  {technicalDetail}
                </pre>
              ) : null}
            </div>
          ) : null}
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input"
            />
            <span>I have read the reasoning above</span>
          </label>
          {onApprove ? (
            <div className="mt-4">
              <AdminConfirmDialog
                title="Confirm AI-assisted action"
                summary="This action will be audit logged. Only proceed if the recommendation is appropriate."
                triggerLabel={approveLabel}
                disabled={!acknowledged}
                onConfirm={onApprove}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
