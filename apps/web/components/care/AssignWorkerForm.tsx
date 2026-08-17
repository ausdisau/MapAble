"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function AssignWorkerForm({
  careBookingId,
  workers,
}: {
  careBookingId: string;
  workers: { id: string; displayName: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        const res = await fetch(`/api/care/bookings/${careBookingId}/assign-worker`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerProfileId: fd.get("workerProfileId") }),
        });
        setLoading(false);
        const d = await res.json();
        if (!res.ok) {
          setMessage(d.error ?? "Assignment failed");
          return;
        }
        setMessage("Worker assigned.");
        window.location.reload();
      }}
    >
      <label htmlFor="workerProfileId" className="text-sm font-medium">
        Assign worker
      </label>
      <select id="workerProfileId" name="workerProfileId" className={formInputClass} required>
        <option value="">Select worker</option>
        {workers.map((w) => (
          <option key={w.id} value={w.id}>
            {w.displayName}
          </option>
        ))}
      </select>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="default"
        size="default"
        disabled={loading || workers.length === 0}
      >
        Assign
      </Button>
    </form>
  );
}
