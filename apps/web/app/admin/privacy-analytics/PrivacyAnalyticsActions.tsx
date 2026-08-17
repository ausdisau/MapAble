"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PrivacyAnalyticsActions() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runPilot() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/privacy-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runLabel: `pilot-${new Date().toISOString().slice(0, 10)}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      setMessage("Pilot run completed");
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={loading}
        onClick={runPilot}
      >
        {loading ? "Running…" : "Run privacy analytics pilot"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
