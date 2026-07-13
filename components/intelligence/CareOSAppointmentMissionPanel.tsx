"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AppointmentMissionState } from "@/intelligence/kernel/v1/appointment-types";

function dependencyClass(status: AppointmentMissionState["dependencies"][number]["status"]) {
  if (status === "confirmed") return "border-emerald-500/40 bg-emerald-500/10";
  if (status === "attention") return "border-amber-500/40 bg-amber-500/10";
  if (status === "blocked") return "border-destructive/40 bg-destructive/10";
  return "border-border bg-muted/30";
}

export function CareOSAppointmentMissionPanel() {
  const [outcome, setOutcome] = useState("Attend my appointment with reliable support and accessible transport.");
  const [title, setTitle] = useState("Health appointment");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [supportTypes, setSupportTypes] = useState("Appointment support\nCommunication support");
  const [communication, setCommunication] = useState("Ask me directly\nAllow extra response time");
  const [access, setAccess] = useState("Power wheelchair clearance\nAccessible bathroom");
  const [highIntensity, setHighIntensity] = useState(false);
  const [backupPreference, setBackupPreference] = useState("participant_selects_each_time");
  const [mission, setMission] = useState<AppointmentMissionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buildMission() {
    setLoading(true);
    setError(null);
    setMission(null);
    try {
      const response = await fetch("/api/intelligence/careos-kernel/v1/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          appointment: {
            title,
            startAt: new Date(startAt).toISOString(),
            endAt: endAt ? new Date(endAt).toISOString() : null,
            location,
            accessPlaceId: null,
          },
          care: {
            required: true,
            supportTypes: supportTypes.split("\n").map((item) => item.trim()).filter(Boolean),
            communicationPreferences: communication.split("\n").map((item) => item.trim()).filter(Boolean),
            accessRequirements: access.split("\n").map((item) => item.trim()).filter(Boolean),
            highIntensitySupport: highIntensity,
            backupPreference,
          },
          transport: {
            required: true,
            pickupAddress: pickupAddress || null,
            returnTripRequired: true,
            vehicleRequirements: access.split("\n").map((item) => item.trim()).filter(Boolean),
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
      if (!response.ok) throw new Error(data.error ?? "The appointment mission could not be prepared.");
      setMission(data.mission as AppointmentMissionState);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The appointment mission could not be prepared.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="careos-appointment-kernel-heading" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">CareOS Kernel v1</p>
        <h2 id="careos-appointment-kernel-heading" className="text-2xl font-bold">One appointment mission, one authority model, one event spine</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">Build a participant-controlled mission linking Care, Transport, Access, evidence, confirmations, human review and continuity. Nothing is submitted from this screen.</p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-5 pt-6">
          <label className="block space-y-2"><span className="font-semibold">Outcome</span><textarea rows={3} value={outcome} onChange={(event) => setOutcome(event.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-3" /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="font-medium">Appointment title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
            <label className="space-y-2"><span className="font-medium">Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
            <label className="space-y-2"><span className="font-medium">Start</span><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
            <label className="space-y-2"><span className="font-medium">End</span><input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
            <label className="space-y-2 md:col-span-2"><span className="font-medium">Pickup address</span><input value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2"><span className="font-medium">Support activities</span><textarea rows={4} value={supportTypes} onChange={(event) => setSupportTypes(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
            <label className="space-y-2"><span className="font-medium">Communication preferences</span><textarea rows={4} value={communication} onChange={(event) => setCommunication(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
            <label className="space-y-2"><span className="font-medium">Access requirements</span><textarea rows={4} value={access} onChange={(event) => setAccess(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="font-medium">Backup preference</span><select value={backupPreference} onChange={(event) => setBackupPreference(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3"><option value="participant_selects_each_time">I select each time</option><option value="known_backup">Known backup</option><option value="verified_provider_pool">Verified provider pool</option><option value="same_worker_only">Same worker only</option><option value="undecided">Not decided</option></select></label>
            <label className="flex min-h-14 items-start gap-3 rounded-lg border p-4"><input type="checkbox" checked={highIntensity} onChange={(event) => setHighIntensity(event.target.checked)} className="mt-1 size-5" /><span><span className="block font-medium">High-intensity support</span><span className="text-sm text-muted-foreground">Forces verified competency evidence and qualified human review.</span></span></label>
          </div>
          <Button type="button" size="lg" loading={loading} onClick={() => void buildMission()} disabled={!startAt || !location.trim()}>Build appointment mission</Button>
        </CardContent>
      </Card>

      {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p> : null}

      {mission ? (
        <div className="space-y-6" aria-live="polite">
          <Card variant="outlined"><CardContent className="space-y-3 pt-6"><p className="text-sm text-muted-foreground">Mission phase</p><h3 className="text-xl font-semibold capitalize">{mission.phase.replaceAll("_", " ")}</h3><p>{mission.outcome}</p><p className="text-sm">Authority: {mission.authority.decision.replaceAll("_", " ")}</p></CardContent></Card>
          <section><h3 className="text-xl font-semibold">Dependencies</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{mission.dependencies.map((dependency) => <article key={dependency.id} className={`rounded-xl border p-5 ${dependencyClass(dependency.status)}`}><div className="flex justify-between gap-3"><h4 className="font-semibold">{dependency.label}</h4><span className="rounded-full border px-2 py-1 text-xs capitalize">{dependency.status}</span></div><p className="mt-3 text-xs text-muted-foreground">Evidence: {dependency.evidence.join(", ") || "none recorded"}</p></article>)}</div></section>
          <div className="grid gap-6 lg:grid-cols-2"><Card variant="outlined"><CardContent className="pt-6"><h3 className="font-semibold">Participant confirmations</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{mission.pendingConfirmations.map((item) => <li key={item}>Review and explicitly confirm the {item} action</li>)}</ul></CardContent></Card><Card variant="outlined"><CardContent className="pt-6"><h3 className="font-semibold">Human review</h3><p className="mt-3 text-sm">{mission.humanReviewRequired ? "Qualified human coordination is required before progression." : "No mandatory human review was identified."}</p></CardContent></Card></div>
          <section><h3 className="text-xl font-semibold">Event spine</h3><ol className="mt-4 space-y-3">{mission.events.map((item) => <li key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.type.replaceAll("_", " ")}</p><time className="text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString("en-AU")}</time></div><p className="mt-2 text-sm">{item.summary}</p></li>)}</ol></section>
        </div>
      ) : null}
    </section>
  );
}
