"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PublishDecisionForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/public-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          summary: form.get("summary"),
          decisionType: form.get("decisionType"),
          rationale: form.get("rationale"),
          disputeContact: form.get("disputeContact"),
          impactedSystems: String(form.get("impactedSystems") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setMessage("Decision published");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Publish decision</h2>
      <input name="title" required placeholder="Title" className="w-full rounded border px-3 py-2 text-sm" />
      <textarea name="summary" required placeholder="Summary" className="w-full rounded border px-3 py-2 text-sm" rows={3} />
      <input name="decisionType" required placeholder="Decision type" className="w-full rounded border px-3 py-2 text-sm" />
      <textarea name="rationale" placeholder="Rationale" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
      <input name="impactedSystems" placeholder="Impacted systems (comma-separated)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="disputeContact" placeholder="Dispute contact" className="w-full rounded border px-3 py-2 text-sm" />
      <Button type="submit" variant="default" size="default" disabled={loading}>
        {loading ? "Publishing…" : "Publish"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
