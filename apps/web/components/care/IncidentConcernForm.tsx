"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function IncidentConcernForm({
  careShiftId,
  redirectTo = "/worker/today",
}: {
  careShiftId?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/incidents/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakePath: "incident",
            category: fd.get("category"),
            severity: fd.get("severity"),
            title: fd.get("title"),
            description: fd.get("description"),
            careShiftId: careShiftId || undefined,
            participantIntent: "report_only",
            immediateRiskPresent: fd.get("immediateRisk") === "on",
            safeguardingConcern: fd.get("safeguarding") === "on",
            autoSubmit: true,
          }),
        });
        setLoading(false);
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Could not submit");
          return;
        }
        router.push(redirectTo);
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Report incident or concern</h1>
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}
      {!careShiftId ? (
        <input type="hidden" name="careShiftId" value="" />
      ) : null}
      <label htmlFor="category" className="text-sm font-medium">
        Category
      </label>
      <select id="category" name="category" className={formInputClass} required>
        <option value="unsafe_care">Unsafe care</option>
        <option value="access_need_not_met">Access need not met</option>
        <option value="safeguarding_concern">Safeguarding concern</option>
        <option value="complaint">Complaint</option>
        <option value="other">Other</option>
      </select>
      <label htmlFor="severity" className="text-sm font-medium">
        Severity
      </label>
      <select id="severity" name="severity" className={formInputClass} defaultValue="medium">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <label htmlFor="title" className="text-sm font-medium">
        Title
      </label>
      <input id="title" name="title" className={formInputClass} required />
      <label htmlFor="description" className="text-sm font-medium">
        What happened?
      </label>
      <textarea id="description" name="description" className={formInputClass} rows={5} required />
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="immediateRisk" />
        Immediate risk present
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="safeguarding" />
        Safeguarding concern
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="escalateQsc" />
        Escalate to Quality &amp; Safeguards Centre workflow
      </label>
      <Button type="submit" variant="default" size="default" disabled={loading}>
        Submit report
      </Button>
    </form>
  );
}
