"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GovernanceCharterActions({ version }: { version: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ratify() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/governance-charter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, action: "ratify" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ratify failed");
      setMessage("Charter ratified");
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={loading}
        onClick={ratify}
      >
        Ratify charter
      </Button>
      {message ? <p className="mt-1 text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
