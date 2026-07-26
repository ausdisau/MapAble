"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { IncidentSeverityExplainer } from "@/components/incidents/IncidentSeverityExplainer";
import { Button } from "@/components/ui/button";

export default function LegacyNewIncidentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const createRes = await fetch("/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: fd.get("category"),
            severity: fd.get("severity"),
            title: fd.get("title"),
            description: fd.get("description"),
            immediateRiskPresent: fd.get("immediateRisk") === "on",
            possibleReportableIncident: fd.get("reportable") === "on",
            safeguardingConcern: fd.get("safeguarding") === "on",
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          setError(data.error ?? "Could not create report. Try again.");
          setLoading(false);
          return;
        }
        const { incident } = await createRes.json();
        await fetch(`/api/incidents/${incident.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        router.push(`/dashboard/safety/incidents/${incident.id}`);
        setLoading(false);
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Report an incident</h1>
      <p className="text-sm text-muted-foreground">
        You can save concerns safely. This does not automatically report to the NDIS
        Commission. If you are in immediate danger, call 000.
      </p>
      {error ? (
        <p role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <IncidentSeverityExplainer />
      <label htmlFor="title" className="text-sm font-medium">
        What happened (title)
      </label>
      <input id="title" name="title" className={formInputClass} required />
      <label htmlFor="description" className="text-sm font-medium">
        Tell us more
      </label>
      <textarea
        id="description"
        name="description"
        className={formInputClass}
        rows={5}
        required
      />
      <label htmlFor="category" className="text-sm font-medium">
        Category
      </label>
      <select id="category" name="category" className={formInputClass}>
        <option value="complaint">Complaint</option>
        <option value="access_need_not_met">Access need not met</option>
        <option value="safeguarding_concern">Safeguarding concern</option>
        <option value="possible_reportable_incident">Possible reportable incident</option>
        <option value="other">Other</option>
      </select>
      <label htmlFor="severity" className="text-sm font-medium">
        How serious is this?
      </label>
      <select id="severity" name="severity" className={formInputClass}>
        <option value="low">Low — inconvenience</option>
        <option value="medium">Medium — needs follow-up</option>
        <option value="high">High — significant impact</option>
        <option value="critical">Critical — immediate safety concern</option>
      </select>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="immediateRisk" /> Immediate risk to safety
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="safeguarding" /> Safeguarding concern
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="reportable" /> Possible reportable incident
      </label>
      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit report
      </Button>
    </form>
  );
}
