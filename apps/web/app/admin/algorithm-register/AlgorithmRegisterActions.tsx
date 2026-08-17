"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AlgorithmRegisterActions({
  algorithmId,
  status,
}: {
  algorithmId: string;
  status: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function act(action: "review" | "publish") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/algorithm-register/${algorithmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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
      {status === "draft" ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={loading}
          onClick={() => act("review")}
        >
          Submit for review
        </Button>
      ) : null}
      {status === "review" || status === "draft" ? (
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => act("publish")}
        >
          Publish
        </Button>
      ) : null}
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
