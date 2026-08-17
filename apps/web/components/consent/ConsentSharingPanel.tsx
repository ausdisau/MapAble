"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ConsentScope } from "@/types/mapable";

type ShareMode = "once" | "always_for_service" | "deny";

export function ConsentSharingPanel({
  scope,
  purpose,
  recipientLabel,
  notSharedNotes,
  onGranted,
}: {
  scope: ConsentScope;
  purpose: string;
  recipientLabel: string;
  notSharedNotes: string[];
  onGranted?: () => void;
}) {
  const [shareMode, setShareMode] = useState<ShareMode>("once");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (shareMode === "deny") {
      setError("Sharing denied — this action will stay blocked.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        purpose,
        shareMode,
        recipientType: "organisation",
        sourceAction: "consent_sharing_panel",
        dataScope: [scope],
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save consent");
      setBusy(false);
      return;
    }
    onGranted?.();
    setBusy(false);
  }

  return (
    <section className="space-y-4 rounded-xl border border-border/60 p-4">
      <h2 className="text-lg font-semibold">Sharing your information</h2>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">What</h3>
        <p className="text-sm">{purpose}</p>
        <p className="mt-1 text-xs text-muted-foreground">Scope: {scope}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">Who</h3>
        <p className="text-sm">{recipientLabel}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">Why</h3>
        <p className="text-sm">
          So your provider can deliver the service you asked for. You can revoke
          this at any time in your consent settings.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">
          Not shared
        </h3>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {notSharedNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">How should we share?</legend>
        {(
          [
            ["once", "Share once for this action"],
            ["always_for_service", "Always for this service"],
            ["deny", "Do not share"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="shareMode"
              value={value}
              checked={shareMode === value}
              onChange={() => setShareMode(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="default"
        size="default"
        disabled={busy}
        onClick={() => void submit()}
      >
        {busy ? "Saving…" : "Save sharing choice"}
      </Button>
    </section>
  );
}
