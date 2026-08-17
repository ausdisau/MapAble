"use client";

import { useState } from "react";

import { PostServiceCsatPrompt } from "@/components/engagement/PostServiceCsatPrompt";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { TransportNextAction } from "@/types/transport";

type DialogKind = "cancel" | "dispute" | null;

export function TransportTripActionDialogs({
  tripId,
  actions,
  organisationId,
  onComplete,
}: {
  tripId: string;
  actions: TransportNextAction[];
  organisationId?: string;
  onComplete: () => void;
}) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [showCsat, setShowCsat] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantActions = actions.filter((a) =>
    ["cancel", "confirm", "dispute"].includes(a.action)
  );

  async function submit(action: TransportNextAction, body?: object) {
    if (!action.href || action.method !== "POST") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(action.href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "That action could not be completed."
        );
        return;
      }
      setDialog(null);
      setReason("");
      if (action.action === "confirm") {
        setShowCsat(true);
        return;
      }
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (participantActions.length === 0) return null;

  if (showCsat) {
    return (
      <PostServiceCsatPrompt
        contextType="transport_trip"
        contextId={tripId}
        organisationId={organisationId}
        label="How was your transport trip?"
        onSubmitted={onComplete}
      />
    );
  }

  return (
    <section className="space-y-3" aria-labelledby={`trip-actions-${tripId}`}>
      <h2 id={`trip-actions-${tripId}`} className="font-semibold">
        Actions
      </h2>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {dialog === "cancel" ? (
        <div
          role="dialog"
          aria-labelledby={`cancel-title-${tripId}`}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <h3 id={`cancel-title-${tripId}`} className="font-semibold">
            Cancel trip
          </h3>
          <label htmlFor={`cancel-reason-${tripId}`} className="text-sm">
            Reason (optional)
          </label>
          <textarea
            id={`cancel-reason-${tripId}`}
            className={formInputClass}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setDialog(null)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              loading={loading}
              onClick={() =>
                submit(
                  participantActions.find((a) => a.action === "cancel")!,
                  { reason: reason || undefined }
                )
              }
            >
              Confirm cancel
            </Button>
          </div>
        </div>
      ) : null}

      {dialog === "dispute" ? (
        <div
          role="dialog"
          aria-labelledby={`dispute-title-${tripId}`}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <h3 id={`dispute-title-${tripId}`} className="font-semibold">
            Dispute trip
          </h3>
          <label htmlFor={`dispute-reason-${tripId}`} className="text-sm">
            Please describe the issue (required)
          </label>
          <textarea
            id={`dispute-reason-${tripId}`}
            className={formInputClass}
            rows={3}
            required
            minLength={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setDialog(null)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              loading={loading}
              disabled={reason.trim().length < 3}
              onClick={() =>
                submit(
                  participantActions.find((a) => a.action === "dispute")!,
                  { reason: reason.trim() }
                )
              }
            >
              Submit dispute
            </Button>
          </div>
        </div>
      ) : null}

      {!dialog ? (
        <ul className="flex flex-wrap gap-2">
          {participantActions.map((action) => (
            <li key={action.action}>
              <Button
                type="button"
                variant={action.action === "cancel" ? "outline" : "default"}
                size="default"
                loading={loading && action.action === "confirm"}
                onClick={() => {
                  if (action.action === "cancel") {
                    setDialog("cancel");
                    setReason("");
                    return;
                  }
                  if (action.action === "dispute") {
                    setDialog("dispute");
                    setReason("");
                    return;
                  }
                  void submit(action, { confirmed: true });
                }}
              >
                {action.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
