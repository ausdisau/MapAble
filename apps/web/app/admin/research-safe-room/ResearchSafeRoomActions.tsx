"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ResearchSafeRoomActions({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function act(action: "ethics" | "activate" | "archive") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/research-safe-room/${projectId}`, {
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
    <div className="mt-2 flex flex-wrap gap-2">
      {status === "draft" ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={loading}
          onClick={() => act("ethics")}
        >
          Submit for ethics review
        </Button>
      ) : null}
      {status === "ethics_review" ? (
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => act("activate")}
        >
          Activate (synthetic only)
        </Button>
      ) : null}
      {status === "active" ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={loading}
          onClick={() => act("archive")}
        >
          Archive
        </Button>
      ) : null}
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
