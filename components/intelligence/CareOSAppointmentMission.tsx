"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type MissionResult = {
  kernelVersion: string;
  state: {
    missionId: string;
    phase: string;
    authority: { decision: string; permittedReads: string[]; prohibitedActions: string[]; reasons: string[] };
    dependencies: Array<{ id: string; label: string; status: string; evidence: string[] }>;
    pendingConfirmations: string[];
    humanReviewRequired: boolean;
    events: Array<{ id: string; type: string; source: string; severity: string; occurredAt: string; summary: string }>;
  };
  supportIntelligence: { readiness: string; decisionsRequired: string[] };
  accessEvidence: { id: string; name: string; confidence: number | null } | null;
  safeguards: string[];
};

export function CareOSAppointmentMission() {
  const [title, setTitle] = useState("Medical appointment");
  const [startAt, setStartAt] = useState("");
  const [location, setLocation] = useState("");
  const [outcome, setOutcome] = useState("Attend my appointment with reliable care, accessible transport and a safe return home.");
  const [supportTypes, setSupportTypes] = useState("Appointment support\nPersonal care");
  const [communication, setCommunication] = useState("");
  const [access, setAccess] = useState("");
  const [highIntensity, setHighIntensity] = useState(false);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buildMission() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/intelligence/careos-kernel-v1/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          appointment: {
            title,
            startAt: new Date(startAt).toISOString(),
            endAt: null,
            location,
            accessPlaceId: null,
          },
          care: {
            required: true,
            supportTypes: supportTypes.split("\n").map((item) => item.trim()).filter(Boolean),
            communicationPreferences: communication.split("\n").map((item) => item.trim()).filter(Boolean),
            accessRequirements: access.split("\n").map((item) => item.trim()).filter(Boolean),
            highIntensitySupport: highIntensity,
            backupPreference: "participant_selects_each_time",
          },
          transport: {
            required: true,
            pickupAddress: null,
            returnTripRequired: true,
            vehicleRequirements: [],
          },
          authority: {
            includeExistingRecords: true,
            includeAccessibilityProfile: false,
            allowProviderEvidenceRead: true,
            allowWorkerEvidenceRead: true,
            allowHumanReview: true,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The appointment mission could not be built.");
      setResult(data as MissionResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The appointment mission could not be built.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="appointment-mission-heading">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">CareOS Kernel v1</p>
        <h1 id="appointment-mission-heading" className="text-3xl font-bold">Attend an appointment</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">One mission, one authority model and one event spine. CareOS prepares coordination; you retain every consequential decision.</p>
      </div>

      <Card variant="elevated"><CardContent className="space-y-5 pt-6">
        <label className="block space-y-2"><span className="font-medium">Outcome</span><textarea rows={3} value={outcome} onChange={(event) => setOutcome(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2" /></label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2"><span className="font-medium">Appointment</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 w-full rounded-lg border bg-background px-3" /></label>
          <label className="space-y-2"><span className="font-medium">Start</span><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="min-h-11 w-full rounded-lg border bg-background px-3" /></label>
          <label className="space-y-2"><span className="font-medium">Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="min-h-11 w-full rounded-lg border bg-background px-3" /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2"><span className="font-medium">Support activities</span><textarea rows={4} value={supportTypes} onChange={(event) => setSupportTypes(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2" /></label>
          <label className="space-y-2"><span className="font-medium">Communication preferences</span><textarea rows={4} value={communication} onChange={(event) => setCommunication(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2" /></label>
          <label className="space-y-2"><span className="font-medium">Access requirements</span><textarea rows={4} value={access} onChange={(event) => setAccess(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2" /></label>
        </div>
        <label className="flex items-start gap-3 rounded-lg border p-4"><input type="checkbox" checked={highIntensity} onChange={(event) => setHighIntensity(event.target.checked)} className="mt-1 size-5" /><span><span className="block font-medium">High-intensity support</span><span className="text-sm text-muted-foreground">Requires explicit competency evidence and qualified human review.</span></span></label>
        <Button type="button" size="lg" loading={loading} disabled={!startAt || !location.trim()} onClick={() => void buildMission()}>Build appointment mission</Button>
      </CardContent></Card>

      {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p> : null}

      {result ? <div className="space-y-6" aria-live="polite">
        <Card variant="outlined"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Mission phase</p><h2 className="text-2xl font-semibold capitalize">{result.state.phase.replaceAll("_", " ")}</h2><p className="mt-2">Authority: {result.state.authority.decision.replaceAll("_", " ")}</p><p className="text-sm text-muted-foreground">Mission {result.state.missionId}</p></CardContent></Card>
        <section><h2 className="text-xl font-semibold">Dependencies</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{result.state.dependencies.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><h3 className="font-medium">{item.label}</h3><span className="rounded-full border px-2 py-1 text-xs capitalize">{item.status}</span></div><p className="mt-2 text-xs text-muted-foreground">Evidence: {item.evidence.join(", ") || "unknown"}</p></article>)}</div></section>
        <div className="grid gap-6 lg:grid-cols-2"><Card variant="outlined"><CardContent className="pt-6"><h2 className="font-semibold">Participant decisions</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{result.supportIntelligence.decisionsRequired.map((item) => <li key={item}>{item}</li>)}{result.state.pendingConfirmations.map((item) => <li key={item}>Confirm the prepared {item} action separately.</li>)}</ul></CardContent></Card><Card variant="outlined"><CardContent className="pt-6"><h2 className="font-semibold">Safeguards</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{result.safeguards.map((item) => <li key={item}>{item}</li>)}</ul></CardContent></Card></div>
        <section><h2 className="text-xl font-semibold">Event spine</h2><ol className="mt-4 space-y-3">{result.state.events.map((item) => <li key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{item.summary}</span><span className="text-xs capitalize">{item.severity}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.source} · {new Date(item.occurredAt).toLocaleString("en-AU")}</p></li>)}</ol></section>
      </div> : null}
    </section>
  );
}
