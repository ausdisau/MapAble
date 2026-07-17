"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConvergenceActionButton({
  label,
  endpoint,
  method = "POST",
  body,
  doneMessage,
}: {
  label: string;
  endpoint: string;
  method?: "POST" | "GET";
  body?: Record<string, unknown>;
  doneMessage?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Request failed");
        return;
      }
      setStatus("done");
      setMessage(doneMessage ?? "Completed (advisory only).");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={status === "loading"}
        className="min-h-11 rounded-lg border border-border px-4 hover:bg-muted disabled:opacity-60"
      >
        {status === "loading" ? "Working…" : label}
      </button>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
