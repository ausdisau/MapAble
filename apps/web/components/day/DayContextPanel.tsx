"use client";

import { useState, type FormEvent } from "react";

type CommunicationChoice =
  | "not-specified"
  | "text-or-aac"
  | "spoken"
  | "interpreter-or-auslan"
  | "ask-me";

const communicationLabels: Record<CommunicationChoice, string> = {
  "not-specified": "Not specified",
  "text-or-aac": "Text or AAC; allow extra response time",
  spoken: "Spoken communication",
  "interpreter-or-auslan": "Interpreter or Auslan support",
  "ask-me": "Ask me which method I prefer",
};

/**
 * An editable preview of the task-specific Day Context advocated by LifeVal.
 * In v0.1 these notes exist only in in-memory React state; no profile, worker
 * message, service record, AI input, storage, cookie or analytics event.
 */
export function DayContextPanel() {
  const [draftPriority, setDraftPriority] = useState("");
  const [draftCommunication, setDraftCommunication] =
    useState<CommunicationChoice>("not-specified");
  const [reviewedPriority, setReviewedPriority] = useState("");
  const [reviewedCommunication, setReviewedCommunication] =
    useState<CommunicationChoice>("not-specified");
  const [hasReviewed, setHasReviewed] = useState(false);

  function reviewDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewedPriority(draftPriority.trim());
    setReviewedCommunication(draftCommunication);
    setHasReviewed(true);
  }

  function clearDraft() {
    setDraftPriority("");
    setDraftCommunication("not-specified");
    setReviewedPriority("");
    setReviewedCommunication("not-specified");
    setHasReviewed(false);
  }

  return (
    <section aria-labelledby="day-context-heading" className="rounded-2xl border bg-card p-5">
      <h2 id="day-context-heading" className="font-heading text-xl font-bold">
        What matters to me today
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        The best plan starts with your priorities and how you communicate, not
        assumptions based on an old conversation. This preview keeps answers
        in this screen only. They are not stored, shared with workers, sent to
        AI, or added to any booking. Avoid entering sensitive details here.
      </p>
      <form className="mt-4 space-y-4" onSubmit={reviewDraft}>
        <div>
          <label htmlFor="day-context-goal" className="block text-sm font-semibold">
            Today&apos;s priority (optional)
          </label>
          <textarea
            id="day-context-goal"
            rows={2}
            maxLength={240}
            value={draftPriority}
            onChange={(event) => {
              setDraftPriority(event.currentTarget.value);
              setHasReviewed(false);
            }}
            placeholder="For example: be on time for my appointment"
            className="mt-2 block min-h-20 w-full rounded-lg border bg-background p-3 text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {draftPriority.length}/240 characters — session only
          </p>
        </div>
        <div>
          <label htmlFor="day-context-communication" className="block text-sm font-semibold">
            Communication preference to review
          </label>
          <select
            id="day-context-communication"
            value={draftCommunication}
            onChange={(event) => {
              setDraftCommunication(event.currentTarget.value as CommunicationChoice);
              setHasReviewed(false);
            }}
            className="mt-2 block min-h-11 w-full max-w-lg rounded-lg border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            {Object.entries(communicationLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            Review my context
          </button>
          <button
            type="button"
            onClick={clearDraft}
            className="min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            Clear from this screen
          </button>
        </div>
      </form>
      <div role="status" aria-live="polite" className="mt-3 text-sm">
        {hasReviewed ? "You reviewed this demonstration context. No service or profile was changed." : "Context has not been reviewed."}
      </div>
      {hasReviewed ? (
        <div className="mt-3 rounded-lg border bg-background p-3 text-sm">
          <h3 className="font-bold">Your example Day Context</h3>
          <p className="mt-2">
            Priority: {reviewedPriority || "No priority entered"}
          </p>
          <p className="mt-1">
            Communication: {communicationLabels[reviewedCommunication]}
          </p>
          <p className="mt-2 text-muted-foreground">
            This does not authorise a worker, change a support plan, or replace
            preferences stored in your account.
          </p>
        </div>
      ) : null}
    </section>
  );
}
