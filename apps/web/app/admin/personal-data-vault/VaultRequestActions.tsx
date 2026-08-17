"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function VaultRequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject" | "complete") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/personal-data-vault/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? "Does not meet policy" : undefined,
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
    <div className="mt-2 flex flex-wrap gap-2">
      {status === "pending" ? (
        <>
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={loading}
            onClick={() => act("approve")}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={loading}
            onClick={() => act("reject")}
          >
            Reject
          </Button>
        </>
      ) : null}
      {status === "approved" ? (
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => act("complete")}
        >
          Complete (human sign-off)
        </Button>
      ) : null}
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
