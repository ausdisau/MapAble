"use client";

import { useState } from "react";

import { PostServiceCsatPrompt } from "@/components/engagement/PostServiceCsatPrompt";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function ServiceLogConfirmDispute({
  logId,
  status,
  organisationId,
}: {
  logId: string;
  status: string;
  organisationId?: string;
}) {
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [showCsat, setShowCsat] = useState(false);

  if (status === "confirmed") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-green-700">You confirmed this service log.</p>
        <PostServiceCsatPrompt
          contextType="care_shift"
          contextId={logId}
          organisationId={organisationId}
          label="How was this care session?"
        />
      </div>
    );
  }

  if (showCsat) {
    return (
      <PostServiceCsatPrompt
        contextType="care_shift"
        contextId={logId}
        organisationId={organisationId}
        label="How was this care session?"
        onSubmitted={() => window.location.reload()}
      />
    );
  }
  if (status === "disputed") {
    return <p className="text-sm text-amber-700">This service log is disputed.</p>;
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Confirm or dispute service</h2>
      <p className="text-sm text-muted-foreground">
        Review the supports delivered. This is not an NDIS funding approval.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={async () => {
            const res = await fetch(`/api/care/service-logs/${logId}/confirm`, {
              method: "POST",
            });
            if (res.ok) setShowCsat(true);
            else setMsg("Could not confirm");
          }}
        >
          Confirm
        </Button>
      </div>
      <label htmlFor="disputeReason" className="text-sm font-medium">
        Dispute reason
      </label>
      <textarea
        id="disputeReason"
        className={formInputClass}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={async () => {
          const res = await fetch(`/api/care/service-logs/${logId}/dispute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disputeReason: reason }),
          });
          if (res.ok) window.location.reload();
          else setMsg("Could not dispute");
        }}
      >
        Dispute
      </Button>
      {msg ? <p role="alert" className="text-sm text-destructive">{msg}</p> : null}
    </div>
  );
}
