"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AdminIncidentActions({
  incidentId,
  status,
}: {
  incidentId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchAction(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/incidents/${incidentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Triage actions</h2>
      <p className="text-sm text-muted-foreground">Current status: {status}</p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={busy}
          onClick={() => void patchAction("acknowledge")}
        >
          Acknowledge
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void patchAction("escalate")}
        >
          Escalate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void patchAction("escalate_qsc")}
        >
          Escalate to QSC workflow
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            void patchAction("resolve", {
              resolutionSummary: "Resolved via admin triage",
            })
          }
        >
          Resolve
        </Button>
      </div>
    </section>
  );
}
