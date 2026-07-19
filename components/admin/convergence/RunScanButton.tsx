"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunScanButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onScan() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/convergence/scans/repository", {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        snapshotId?: string;
        collisionCount?: number;
        prCount?: number;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Scan failed");
        return;
      }
      setStatus("done");
      setMessage(
        `Snapshot ${data.snapshotId}: ${data.prCount ?? 0} PRs, ${data.collisionCount ?? 0} collisions. Advisory only — no merges performed.`
      );
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error running scan");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onScan}
        disabled={status === "loading"}
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-60"
      >
        {status === "loading" ? "Scanning…" : "Run repository scan"}
      </button>
      {message ? (
        <p
          role="status"
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
