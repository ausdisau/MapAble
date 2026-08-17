"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function OutcomesWaveForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/long-term-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel: form.get("waveLabel"),
          outcomeKey: form.get("outcomeKey"),
          value: Number(form.get("value")),
          cohortSize: Number(form.get("cohortSize")),
          narrative: form.get("narrative"),
          waveLabel: form.get("waveLabel"),
          continuityMetricKey: form.get("continuityMetricKey") || undefined,
          measurementPeriodStart: form.get("measurementPeriodStart") || undefined,
          measurementPeriodEnd: form.get("measurementPeriodEnd") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setMessage("Outcome published");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Publish outcome wave</h2>
      <input name="waveLabel" required placeholder="Wave label" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="outcomeKey" required placeholder="Outcome key" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="value" type="number" step="any" required placeholder="Value" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="cohortSize" type="number" required placeholder="Cohort size" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="continuityMetricKey" placeholder="Continuity metric key (optional)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="measurementPeriodStart" type="date" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="measurementPeriodEnd" type="date" className="w-full rounded border px-3 py-2 text-sm" />
      <textarea name="narrative" placeholder="Narrative" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Publishing…" : "Publish"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
