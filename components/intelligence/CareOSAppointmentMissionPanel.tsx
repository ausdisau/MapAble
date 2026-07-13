"use client";

import { useState } from "react";

import { CareOSActionWorkbench } from "@/components/intelligence/CareOSActionWorkbench";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AppointmentMissionState } from "@/intelligence/kernel/v1/appointment-types";

function dependencyClass(
  status: AppointmentMissionState["dependencies"][number]["status"],
) {
  if (status === "confirmed") return "border-emerald-500/40 bg-emerald-500/10";
  if (status === "attention") return "border-amber-500/40 bg-amber-500/10";
  if (status === "blocked") return "border-destructive/40 bg-destructive/10";
  return "border-border bg-muted/30";
}

export function CareOSAppointmentMissionPanel() {
  const [outcome, setOutcome] = useState(
    "Attend my appointment with reliable support and accessible transport.",
  );
  const [title, setTitle] = useState("Health appointment");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [accessPlaceId, setAccessPlaceId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [supportTypes, setSupportTypes] = useState(
    "Appointment support\nCommunication support",
  );
  const [communication, setCommunication] = useState(
    "Ask me directly\nAllow extra response time",
  );
  const [access, setAccess] = useState(
    "Power wheelchair clearance\nAccessible bathroom",
  );
  const [highIntensity, setHighIntensity] = useState(false);
  const [backupPreference, setBackupPreference] = useState(
    "participant_selects_each_time",
  );
  const [mission, setMission] = useState<AppointmentMissionState | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState("achieved");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [correctionOf, setCorrectionOf] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buildMission() {
    setLoading(true);
    setError(null);
    setMission(null);
    try {
      const response = await fetch(
        "/api/intelligence/careos-kernel/v1/appointment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outcome,
            appointment: {
              title,
              startAt: new Date(startAt).toISOString(),
              endAt: endAt ? new Date(endAt).toISOString() : null,
              location,
              accessPlaceId: accessPlaceId.trim() || null,
            },
            care: {
              required: true,
              supportTypes: supportTypes
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
              communicationPreferences: communication
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
              accessRequirements: access
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
              highIntensitySupport: highIntensity,
              backupPreference,
            },
            transport: {
              required: true,
              pickupAddress: pickupAddress || null,
              returnTripRequired: true,
              vehicleRequirements: access
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            },
            authority: {
              includeExistingRecords: true,
              includeAccessibilityProfile: false,
              allowProviderEvidenceRead: true,
              allowWorkerEvidenceRead: true,
              allowHumanReview: true,
            },
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ?? "The appointment mission could not be prepared.",
        );
      }
      setMission(data.mission as AppointmentMissionState);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The appointment mission could not be prepared.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function recordOutcome() {
    if (!mission) return;
    setOutcomeLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/intelligence/careos-missions/${mission.missionId}/outcome`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outcome: outcomeStatus,
            summary: outcomeSummary,
            correctionOf: correctionOf || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "The outcome could not be recorded.");
      }
      setMission(data.mission as AppointmentMissionState);
      setOutcomeSummary("");
      setCorrectionOf("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The outcome could not be recorded.",
      );
    } finally {
      setOutcomeLoading(false);
    }
  }

  const field =
    "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2";

  return (
    <section
      aria-labelledby="careos-appointment-kernel-heading"
      className="space-y-8"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          CareOS Kernel v1
        </p>
        <h1
          id="careos-appointment-kernel-heading"
          className="text-3xl font-bold"
        >
          One appointment mission, one authority model, one event spine
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Build a participant-controlled mission linking Care, Transport,
          published Access evidence, explicit confirmations, human review and
          continuity. CareOS prepares the path. You decide what proceeds.
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-5 pt-6">
          <label className="block space-y-2">
            <span className="font-semibold">Desired outcome</span>
            <textarea
              rows={3}
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              className={field}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Appointment title
              <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Location
              <input className={field} value={location} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label>
              Start
              <input className={field} type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
            </label>
            <label>
              End
              <input className={field} type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
            </label>
            <label>
              Pickup address
              <input className={field} value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} />
            </label>
            <label>
              Published MapAble Access place ID
              <input className={field} value={accessPlaceId} onChange={(event) => setAccessPlaceId(event.target.value)} aria-describedby="access-place-help" />
              <span id="access-place-help" className="mt-1 block text-xs text-muted-foreground">
                The server loads the published place record. An unknown or unpublished ID remains unknown evidence.
              </span>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              Support activities
              <textarea className={field} rows={4} value={supportTypes} onChange={(event) => setSupportTypes(event.target.value)} />
            </label>
            <label>
              Communication preferences
              <textarea className={field} rows={4} value={communication} onChange={(event) => setCommunication(event.target.value)} />
            </label>
            <label>
              Access requirements
              <textarea className={field} rows={4} value={access} onChange={(event) => setAccess(event.target.value)} />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Backup preference
              <select className={field} value={backupPreference} onChange={(event) => setBackupPreference(event.target.value)}>
                <option value="participant_selects_each_time">I select each time</option>
                <option value="known_backup">Known backup</option>
                <option value="verified_provider_pool">Verified provider pool</option>
                <option value="same_worker_only">Same worker only</option>
                <option value="undecided">Not decided</option>
              </select>
            </label>
            <label className="flex min-h-14 items-start gap-3 rounded-lg border p-4">
              <input type="checkbox" checked={highIntensity} onChange={(event) => setHighIntensity(event.target.checked)} className="mt-1 size-5" />
              <span>
                <span className="block font-medium">High-intensity support</span>
                <span className="text-sm text-muted-foreground">Requires verified competency evidence and qualified human review.</span>
              </span>
            </label>
          </div>
          <Button type="button" size="lg" loading={loading} onClick={() => void buildMission()} disabled={!startAt || !location.trim()}>
            Build appointment mission
          </Button>
        </CardContent>
      </Card>

      {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p> : null}

      {mission ? (
        <div className="space-y-8" aria-live="polite">
          <Card variant="outlined">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm text-muted-foreground">Mission phase</p>
              <h2 className="text-2xl font-semibold capitalize">{mission.phase.replaceAll("_", " ")}</h2>
              <p>{mission.outcome}</p>
              <p className="text-sm">Authority: {mission.authority.decision.replaceAll("_", " ")}</p>
              <p className="break-all text-xs text-muted-foreground">Mission {mission.missionId}</p>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-semibold">Dependencies and evidence</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {mission.dependencies.map((item) => (
                <article key={item.id} className={`rounded-xl border p-5 ${dependencyClass(item.status)}`}>
                  <div className="flex justify-between gap-3">
                    <h3 className="font-semibold">{item.label}</h3>
                    <span className="rounded-full border px-2 py-1 text-xs capitalize">{item.status}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Evidence: {item.evidence.join(", ") || "none recorded"}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="outlined"><CardContent className="pt-6"><h2 className="font-semibold">Participant confirmations</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{mission.pendingConfirmations.length ? mission.pendingConfirmations.map((item) => <li key={item}>Review and explicitly confirm the {item} action</li>) : <li>No action confirmation is currently pending.</li>}</ul></CardContent></Card>
            <Card variant="outlined"><CardContent className="pt-6"><h2 className="font-semibold">Human review</h2><p className="mt-3 text-sm">{mission.humanReviewRequired ? "Qualified human coordination is required before progression." : "No mandatory human review was identified."}</p></CardContent></Card>
          </div>

          <CareOSActionWorkbench
            missionId={mission.missionId}
            onReceipt={() => {
              setMission((current) => current ? { ...current } : current);
            }}
          />

          <section>
            <h2 className="text-xl font-semibold">Outcome evidence</h2>
            {mission.outcomeEvidence.length ? (
              <ol className="mt-4 space-y-3">
                {mission.outcomeEvidence.map((item) => (
                  <li key={item.sourceId} className="rounded-lg border p-4">
                    <p className="font-medium">{item.type.replaceAll("_", " ")}</p>
                    {item.summary ? <p className="mt-2 text-sm">{item.summary}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.observedAt).toLocaleString("en-AU")}</p>
                    {item.correctionOf ? <p className="mt-1 text-xs">Corrects record {item.correctionOf}</p> : null}
                    <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setCorrectionOf(item.sourceId)}>Correct this outcome record</Button>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 rounded-lg border bg-muted/30 p-4">No service or participant outcome evidence has been recorded.</p>}

            <Card className="mt-4" variant="outlined">
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-semibold">{correctionOf ? "Correct an outcome record" : "Record your outcome"}</h3>
                {correctionOf ? <p className="text-sm">This new record will supersede {correctionOf}. The earlier record remains visible.</p> : null}
                <label>Outcome<select className={field} value={outcomeStatus} onChange={(event) => setOutcomeStatus(event.target.value)}><option value="achieved">Achieved</option><option value="partly_achieved">Partly achieved</option><option value="not_achieved">Not achieved</option><option value="cancelled">Cancelled</option></select></label>
                <label>What happened?<textarea className={field} rows={4} value={outcomeSummary} onChange={(event) => setOutcomeSummary(event.target.value)} /></label>
                <div className="flex flex-wrap gap-3">
                  <Button loading={outcomeLoading} disabled={outcomeSummary.trim().length < 3} onClick={() => void recordOutcome()}>{correctionOf ? "Save correction" : "Record outcome"}</Button>
                  {correctionOf ? <Button variant="ghost" onClick={() => setCorrectionOf("")}>Cancel correction</Button> : null}
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Event spine</h2>
            <ol className="mt-4 space-y-3">
              {mission.events.map((item) => (
                <li key={item.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.type.replaceAll("_", " ")}</p><time className="text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString("en-AU")}</time></div>
                  <p className="mt-2 text-sm">{item.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </section>
  );
}
