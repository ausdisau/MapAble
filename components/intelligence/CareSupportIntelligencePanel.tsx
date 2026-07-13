"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReadinessCheck = {
  id: string;
  label: string;
  status: "confirmed" | "attention" | "unknown";
  explanation: string;
  evidence: string[];
};

type SupportIntelligenceResult = {
  generatedAt: string;
  readiness:
    | "needs_information"
    | "participant_review_required"
    | "human_coordination_recommended"
    | "ready_for_participant_review";
  supportBrief: {
    participantName: string | null;
    outcome: string;
    context: string;
    region: string | null;
    desiredStartAt: string | null;
    durationMinutes: number | null;
    supportTypes: string[];
    communicationPreferences: string[];
    accessRequirements: string[];
    linkedTransportRequired: boolean;
    highIntensitySupportRequested: boolean;
    backupPreference: string;
    safeguardsForHumanReview: string[];
  };
  checks: ReadinessCheck[];
  decisionsRequired: string[];
  continuityPlan: {
    beforeSupport: string[];
    duringSupport: string[];
    ifUnavailable: string[];
  };
  evidenceSummary: Record<string, number>;
  safeguards: string[];
};

const SUPPORT_OPTIONS = [
  "Personal care",
  "Community access",
  "Appointment support",
  "Household assistance",
  "Meal support",
  "Communication support",
  "Employment support",
  "Capacity building",
];

function statusClass(status: ReadinessCheck["status"]): string {
  if (status === "confirmed") return "border-emerald-500/40 bg-emerald-500/10";
  if (status === "attention") return "border-amber-500/40 bg-amber-500/10";
  return "border-border bg-muted/30";
}

function readinessLabel(value: SupportIntelligenceResult["readiness"]): string {
  return value.replaceAll("_", " ");
}

export function CareSupportIntelligencePanel() {
  const [goal, setGoal] = useState("Help me prepare reliable support for my next community appointment.");
  const [supportContext, setSupportContext] = useState("community");
  const [desiredStartAt, setDesiredStartAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [region, setRegion] = useState("");
  const [supportTypes, setSupportTypes] = useState<string[]>(["Appointment support"]);
  const [communicationPreferences, setCommunicationPreferences] = useState("");
  const [accessRequirements, setAccessRequirements] = useState("");
  const [backupPreference, setBackupPreference] = useState("undecided");
  const [linkedTransportRequired, setLinkedTransportRequired] = useState(true);
  const [highIntensitySupportRequested, setHighIntensitySupportRequested] = useState(false);
  const [includeExistingRecords, setIncludeExistingRecords] = useState(true);
  const [result, setResult] = useState<SupportIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSupportSummary = useMemo(
    () => (supportTypes.length > 0 ? supportTypes.join(", ") : "No support activities selected"),
    [supportTypes],
  );

  function toggleSupportType(value: string) {
    setSupportTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/intelligence/care-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          supportContext,
          desiredStartAt: desiredStartAt ? new Date(desiredStartAt).toISOString() : null,
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
          supportTypes,
          communicationPreferences: communicationPreferences
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          accessRequirements: accessRequirements
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          region: region.trim() || null,
          linkedTransportRequired,
          highIntensitySupportRequested,
          backupPreference,
          includeExistingRecords,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Support intelligence could not be prepared.");
      setResult(data as SupportIntelligenceResult);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Support intelligence could not be prepared.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="care-support-intelligence-heading" className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          CareOS Support Intelligence
        </p>
        <h2 id="care-support-intelligence-heading" className="text-2xl font-bold">
          Build a participant-led support brief
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Review support requirements, communication, access, backup arrangements and live evidence.
          CareOS does not assign or rank workers, diagnose needs, or replace human coordination.
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-6 pt-6">
          <label className="block space-y-2" htmlFor="support-intelligence-goal">
            <span className="font-semibold">What outcome matters to you?</span>
            <textarea
              id="support-intelligence-goal"
              rows={3}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="font-medium">Support context</span>
              <select
                value={supportContext}
                onChange={(event) => setSupportContext(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
              >
                <option value="home">Home</option>
                <option value="community">Community</option>
                <option value="health">Health appointment</option>
                <option value="education">Education</option>
                <option value="employment">Employment</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="font-medium">Preferred start</span>
              <input
                type="datetime-local"
                value={desiredStartAt}
                onChange={(event) => setDesiredStartAt(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
              />
            </label>
            <label className="space-y-2">
              <span className="font-medium">Duration, minutes</span>
              <input
                type="number"
                min={15}
                max={1440}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
              />
            </label>
          </div>

          <fieldset>
            <legend className="font-semibold">Support activities or capability areas</legend>
            <p className="mt-1 text-sm text-muted-foreground">Selected: {selectedSupportSummary}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {SUPPORT_OPTIONS.map((option) => (
                <label key={option} className="flex min-h-12 items-center gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={supportTypes.includes(option)}
                    onChange={() => toggleSupportType(option)}
                    className="size-5"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="font-medium">Communication preferences</span>
              <textarea
                rows={4}
                value={communicationPreferences}
                onChange={(event) => setCommunicationPreferences(event.target.value)}
                placeholder="One preference per line, for example: Ask me directly; allow extra response time; use AAC."
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-2">
              <span className="font-medium">Access requirements</span>
              <textarea
                rows={4}
                value={accessRequirements}
                onChange={(event) => setAccessRequirements(event.target.value)}
                placeholder="One requirement per line, for example: power wheelchair clearance; accessible bathroom."
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="font-medium">Region</span>
              <input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="Leave blank to use your recorded home region"
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
              />
            </label>
            <label className="space-y-2">
              <span className="font-medium">Backup preference</span>
              <select
                value={backupPreference}
                onChange={(event) => setBackupPreference(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
              >
                <option value="undecided">Ask me before deciding</option>
                <option value="same_worker_only">Same worker only</option>
                <option value="known_backup">Known backup worker</option>
                <option value="verified_provider_pool">Verified provider pool</option>
                <option value="participant_selects_each_time">I select each time</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex min-h-14 items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={linkedTransportRequired}
                onChange={(event) => setLinkedTransportRequired(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Linked accessible transport</span>
                <span className="text-sm text-muted-foreground">Treat transport as a separate dependency.</span>
              </span>
            </label>
            <label className="flex min-h-14 items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={highIntensitySupportRequested}
                onChange={(event) => setHighIntensitySupportRequested(event.target.checked)}
              />
              <span>
                <span className="block font-medium">High-intensity support requested</span>
                <span className="text-sm text-muted-foreground">Require explicit competency evidence and human review.</span>
              </span>
            </label>
            <label className="flex min-h-14 items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={includeExistingRecords}
                onChange={(event) => setIncludeExistingRecords(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Use my Care records</span>
                <span className="text-sm text-muted-foreground">Read current preferences, needs, requests and shifts.</span>
              </span>
            </label>
          </div>

          <Button type="button" size="lg" loading={loading} onClick={() => void generate()}>
            Prepare support intelligence
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-6" aria-live="polite">
          <Card variant="outlined">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-medium text-muted-foreground">Readiness</p>
              <h3 className="text-xl font-semibold capitalize">{readinessLabel(result.readiness)}</h3>
              <p>{result.supportBrief.outcome}</p>
              <p className="text-sm text-muted-foreground">
                {result.supportBrief.region ?? "Region not confirmed"} · {result.supportBrief.supportTypes.join(", ") || "Support activities not confirmed"}
              </p>
            </CardContent>
          </Card>

          <section aria-labelledby="support-readiness-checks-heading">
            <h3 id="support-readiness-checks-heading" className="text-xl font-semibold">Readiness checks</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {result.checks.map((check) => (
                <article key={check.id} className={`rounded-xl border p-5 ${statusClass(check.status)}`}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <h4 className="font-semibold">{check.label}</h4>
                    <span className="rounded-full border px-2 py-1 text-xs font-medium capitalize">{check.status}</span>
                  </div>
                  <p className="mt-2 text-sm">{check.explanation}</p>
                  {check.evidence.length > 0 ? (
                    <p className="mt-3 break-words text-xs text-muted-foreground">
                      Evidence: {check.evidence.join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="outlined">
              <CardContent className="pt-6">
                <h3 className="font-semibold">Participant decisions still needed</h3>
                {result.decisionsRequired.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No obvious information gap was found.</p>
                ) : (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                    {result.decisionsRequired.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent className="pt-6">
                <h3 className="font-semibold">Continuity if support changes</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                  {result.continuityPlan.ifUnavailable.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card variant="outlined">
            <CardContent className="pt-6">
              <h3 className="font-semibold">Evidence snapshot</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(result.evidenceSummary).map(([key, value]) => (
                  <div key={key} className="rounded-lg border p-3">
                    <dt className="text-xs text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                    <dd className="mt-1 text-2xl font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <ul className="space-y-1 text-sm text-muted-foreground">
            {result.safeguards.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
