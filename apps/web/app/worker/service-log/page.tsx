"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function WorkerServiceLogPage() {
  const searchParams = useSearchParams();
  const shiftId = searchParams.get("shiftId") ?? "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-heading text-2xl font-bold">Service log</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMessage(null);
          const fd = new FormData(e.currentTarget);
          const res = await fetch("/api/care/service-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              careShiftId: fd.get("careShiftId") || shiftId,
              notes: fd.get("notes"),
              durationMinutes: Number(fd.get("durationMinutes")) || undefined,
              supportsDelivered: [{ name: fd.get("supportName") || "Support delivered" }],
            }),
          });
          setLoading(false);
          if (res.ok) setMessage("Service log submitted.");
          else {
            const d = await res.json();
            setMessage(d.error ?? "Failed");
          }
        }}
      >
        <label htmlFor="careShiftId" className="text-sm font-medium">
          Shift ID
        </label>
        <input
          id="careShiftId"
          name="careShiftId"
          className={formInputClass}
          defaultValue={shiftId}
          required
        />
        <label htmlFor="supportName" className="text-sm font-medium">
          Support delivered
        </label>
        <input id="supportName" name="supportName" className={formInputClass} required />
        <label htmlFor="durationMinutes" className="text-sm font-medium">
          Duration (minutes)
        </label>
        <input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          className={formInputClass}
        />
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea id="notes" name="notes" className={formInputClass} rows={4} />
        <Button type="submit" variant="default" size="default" disabled={loading}>
          Submit log
        </Button>
      </form>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </div>
  );
}
