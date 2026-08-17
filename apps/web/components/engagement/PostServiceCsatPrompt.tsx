"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type Props = {
  contextType: string;
  contextId: string;
  organisationId?: string;
  label?: string;
  onSubmitted?: () => void;
};

export function PostServiceCsatPrompt({
  contextType,
  contextId,
  organisationId,
  label = "How was this service?",
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/engagement/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service_feedback",
          rating,
          body: comment || `Service feedback (${rating}/5)`,
          contextType,
          contextId,
          organisationId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Could not save feedback");
        return;
      }
      setDone(true);
      onSubmitted?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thank you — your feedback helps improve services.
      </p>
    );
  }

  return (
    <section
      aria-labelledby={`csat-${contextId}`}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <h3 id={`csat-${contextId}`} className="font-semibold text-sm">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Rating 1 to 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            className={`min-h-10 min-w-10 rounded-md border px-3 text-sm font-medium ${
              rating === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <label className="block text-sm">
        Optional comment
        <textarea
          className={`${formInputClass} mt-1 min-h-[4rem]`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="default" size="sm" disabled={!rating || loading} onClick={() => void submit()}>
        {loading ? "Saving…" : "Send feedback"}
      </Button>
    </section>
  );
}
