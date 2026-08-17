"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function OversightBoardActions({
  meetingId,
  status,
}: {
  meetingId: string;
  status: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function act(action: "held" | "minutes") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/oversight-board/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          minutesSummary:
            action === "minutes"
              ? "Minutes published via admin workflow."
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage(`${action} successful`);
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      {status === "scheduled" ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={loading}
          onClick={() => act("held")}
        >
          Mark held
        </Button>
      ) : null}
      {status === "held" ? (
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => act("minutes")}
        >
          Publish minutes
        </Button>
      ) : null}
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
