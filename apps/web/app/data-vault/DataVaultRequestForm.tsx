"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const REQUEST_TYPES = [
  { value: "export", label: "Export my data" },
  { value: "portability", label: "Portability bundle" },
  { value: "deletion_review", label: "Deletion request" },
] as const;

export function DataVaultRequestForm() {
  const [requestType, setRequestType] =
    useState<(typeof REQUEST_TYPES)[number]["value"]>("export");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitRequest() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/data-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setStatus(data.message ?? "Request queued for human review.");
      window.location.reload();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        All export and deletion requests require human review before completion.
      </p>
      <div className="space-y-2">
        {REQUEST_TYPES.map((t) => (
          <label key={t.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="requestType"
              value={t.value}
              checked={requestType === t.value}
              onChange={() => setRequestType(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={loading}
        onClick={submitRequest}
      >
        {loading ? "Submitting…" : "Submit request"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
