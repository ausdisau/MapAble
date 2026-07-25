"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export type AmbassadorAuditPayload = {
  placeName: string;
  placeSlugOrId?: string;
  entranceStepFree: boolean;
  accessibleToilet: boolean;
  notes: string;
};

type AmbassadorAuditFormProps = {
  onSubmitted?: (payload: AmbassadorAuditPayload) => void;
};

export function AmbassadorAuditForm({ onSubmitted }: AmbassadorAuditFormProps) {
  const [placeName, setPlaceName] = useState("");
  const [placeSlugOrId, setPlaceSlugOrId] = useState("");
  const [entranceStepFree, setEntranceStepFree] = useState(false);
  const [accessibleToilet, setAccessibleToilet] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("submitting");

    const payload: AmbassadorAuditPayload = {
      placeName: placeName.trim(),
      placeSlugOrId: placeSlugOrId.trim() || undefined,
      entranceStepFree,
      accessibleToilet,
      notes: notes.trim(),
    };

    try {
      const res = await fetch("/api/ambassador/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not submit audit");
        setStatus("error");
        return;
      }
      setStatus("done");
      onSubmitted?.(payload);
      setPlaceName("");
      setPlaceSlugOrId("");
      setEntranceStepFree(false);
      setAccessibleToilet(false);
      setNotes("");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <AccessibleFormField id="ambassador-place-name" label="Venue name" required>
        <input
          id="ambassador-place-name"
          className={formInputClass}
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          required
          autoComplete="organization"
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="ambassador-place-id"
        label="Place ID or slug (optional)"
        hint="Link to an existing Access Map place when known."
      >
        <input
          id="ambassador-place-id"
          className={formInputClass}
          value={placeSlugOrId}
          onChange={(e) => setPlaceSlugOrId(e.target.value)}
        />
      </AccessibleFormField>

      <fieldset className="space-y-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">Accessibility checks</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={entranceStepFree}
            onChange={(e) => setEntranceStepFree(e.target.checked)}
          />
          Step-free entrance
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={accessibleToilet}
            onChange={(e) => setAccessibleToilet(e.target.checked)}
          />
          Accessible toilet available
        </label>
      </fieldset>

      <AccessibleFormField id="ambassador-notes" label="Notes">
        <textarea
          id="ambassador-notes"
          className={formInputClass}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
      </AccessibleFormField>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {status === "done" ? (
        <p className="text-sm text-muted-foreground" role="status">
          Audit submitted for review. Thank you for mapping with MapAble.
        </p>
      ) : null}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit accessibility audit"}
      </Button>
    </form>
  );
}
