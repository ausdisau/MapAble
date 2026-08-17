"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GovernmentReportingClient() {
  const [title, setTitle] = useState("Council summary draft");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function draftPack() {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/government-reporting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packType: "council_summary", title }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setResult(data.error ?? "Draft failed");
      return;
    }
    setResult(data.pack?.id ? `Draft pack created: ${data.pack.id}` : JSON.stringify(data));
  }

  return (
    <div className="max-w-xl space-y-4">
      <label htmlFor="pack-title" className="text-sm font-medium">
        Pack title
      </label>
      <input
        id="pack-title"
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button type="button" variant="default" size="default" disabled={busy} onClick={() => void draftPack()}>
        {busy ? "Drafting…" : "Draft report pack"}
      </Button>
      {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
    </div>
  );
}
