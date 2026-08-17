"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function BenchmarkCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/provider-benchmarking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: form.get("organisationId") || undefined,
          metricKey: form.get("metricKey"),
          value: Number(form.get("value")),
          cohortSize: Number(form.get("cohortSize")),
          periodLabel: form.get("periodLabel"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Capture failed");
      setMessage("Benchmark captured");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Capture benchmark</h2>
      <input name="organisationId" placeholder="Organisation ID (optional)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="metricKey" required placeholder="Metric key" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="value" required type="number" step="0.01" placeholder="Value" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="cohortSize" required type="number" placeholder="Cohort size" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="periodLabel" required placeholder="Period (e.g. 2026-06)" className="w-full rounded border px-3 py-2 text-sm" />
      <Button type="submit" variant="default" size="default" disabled={loading}>
        {loading ? "Capturing…" : "Capture"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
