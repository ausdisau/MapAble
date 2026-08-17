"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WORKER_ASSIST_DISCLAIMER } from "@/lib/config/y3-national-trust";

export function WorkerAssistPanel({
  shiftId,
  workerProfileId,
}: {
  shiftId: string;
  workerProfileId: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/worker/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId, workerProfileId, prompt }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    setResponse(data.response);
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{WORKER_ASSIST_DISCLAIMER}</p>
      <form onSubmit={ask} className="space-y-2">
        <textarea
          className="w-full rounded border p-2 text-sm"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about shift tasks, timesheet, or incident templates…"
          required
        />
        <Button type="submit" variant="default" size="default">
          Ask shift assist
        </Button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {response ? <p className="text-sm">{response}</p> : null}
    </div>
  );
}
