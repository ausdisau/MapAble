"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Gap = {
  requirementKey: string;
  label: string;
  state: string;
  copy: string;
  nextAction: string;
  reasonCodes: string[];
};

type Passport = {
  displayName: string;
  organisationName: string;
  screening: { displayStatus: string; independentlyVerified: boolean };
  credentials: Array<{
    id: string;
    type: string;
    source: string;
    issuer: string | null;
    identityLinked: boolean;
    verificationState: string;
    expiresAt: string | null;
    nextAction: string;
  }>;
  competencies: Array<{
    id: string;
    type: string;
    source: string;
    verificationState: string;
    assessorRole: string;
    nextAction: string;
    restrictions: string[];
  }>;
  training: Array<{ moduleOrCourse: string; status: string; identityLinked: boolean }>;
  disputes: Array<{ id: string; evidenceKind: string; status: string }>;
  gaps: Gap[];
  sharePreference: {
    shareWithProviders: boolean;
    shareWithParticipants: boolean;
    shareScreeningSummary: boolean;
    shareQualifications: boolean;
    shareTraining: boolean;
    shareCompetencies: boolean;
  } | null;
};

type LearningItem = {
  id: string;
  title: string;
  kind: string;
  code?: string;
  url?: string;
  disclaimer: string;
  highIntensity: boolean;
};

export function CapabilityPassportClient({
  workerProfileId,
}: {
  workerProfileId: string;
}) {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [learning, setLearning] = useState<LearningItem[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [aiLabel, setAiLabel] = useState(false);
  const [status, setStatus] = useState("Loading your passport.");
  const [disputeReason, setDisputeReason] = useState("");
  const [share, setShare] = useState({
    shareWithProviders: false,
    shareWithParticipants: false,
    shareScreeningSummary: false,
    shareQualifications: false,
    shareTraining: false,
    shareCompetencies: false,
  });

  async function load() {
    const res = await fetch("/api/workforce/passport/me", { cache: "no-store" });
    if (res.status === 404) {
      setStatus("Capability Passport is not available in this environment.");
      return;
    }
    if (!res.ok) {
      setStatus("The passport could not be loaded.");
      return;
    }
    const data = (await res.json()) as Passport;
    setPassport(data);
    if (data.sharePreference) setShare(data.sharePreference);
    const learn = await fetch(
      `/api/workforce/learning/recommendations?workerProfileId=${encodeURIComponent(workerProfileId)}`,
    );
    if (learn.ok) {
      const payload = (await learn.json()) as { items: LearningItem[] };
      setLearning(payload.items);
    }
    setStatus("Passport loaded. No universal trust or safety score is shown.");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerProfileId]);

  async function evaluate(explainWithAi: boolean) {
    setStatus("Evaluating readiness.");
    const res = await fetch("/api/workforce/passport/readiness/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerProfileId, explainWithAi }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Readiness could not be evaluated.");
      return;
    }
    setExplanation(data.explanation?.text ?? "");
    setAiLabel(Boolean(data.explanation?.labelledAi));
    setStatus("Readiness evaluated. This does not book or assign any support.");
  }

  async function openDispute() {
    if (!passport?.credentials[0] && !passport?.competencies[0]) {
      setStatus("Choose an evidence row before disputing.");
      return;
    }
    const evidence = passport.credentials[0] ?? passport.competencies[0];
    const res = await fetch("/api/workforce/passport/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerProfileId,
        evidenceKind: passport.credentials[0] ? "credential" : "competency",
        evidenceId: evidence.id,
        reason: disputeReason || "Worker requests a correction of this record.",
      }),
    });
    setStatus(res.ok ? "Dispute opened for human review." : "Dispute could not be opened.");
    if (res.ok) void load();
  }

  async function saveShare() {
    const res = await fetch("/api/workforce/passport/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(share),
    });
    setStatus(res.ok ? "Sharing preferences saved." : "Sharing preferences could not be saved.");
  }

  return (
    <div className="space-y-6 motion-reduce:transition-none">
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <aside className="rounded-xl border p-4 text-base leading-relaxed">
        <h2 className="text-lg font-semibold">Easy Read</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Finishing a course is not the same as being assessed as competent.</li>
          <li>A mock passport is not a worker screening clearance.</li>
          <li>A clearance is not a promise that support is always safe.</li>
        </ul>
      </aside>

      {passport ? (
        <>
          <section className="space-y-2 rounded-xl border p-4" aria-labelledby="screening-heading">
            <h2 id="screening-heading" className="text-lg font-semibold">
              Screening
            </h2>
            <p>{passport.screening.displayStatus}</p>
            <p className="text-sm text-muted-foreground">
              Source: official record only. Screenshots, applications and mock credentials are
              not clearance.
            </p>
          </section>

          <EvidenceList title="Qualifications" rows={passport.credentials} />
          <section className="space-y-2 rounded-xl border p-4">
            <h2 className="text-lg font-semibold">Training</h2>
            {passport.training.length === 0 ? (
              <p>No training records bound to your identity.</p>
            ) : (
              <ul className="space-y-2">
                {passport.training.map((row) => (
                  <li key={row.moduleOrCourse} className="rounded-lg border p-3">
                    <strong>{row.moduleOrCourse}</strong> — {row.status}. Identity linked:{" "}
                    {row.identityLinked ? "yes" : "no"}. Training is not competence.
                  </li>
                ))}
              </ul>
            )}
          </section>
          <EvidenceList
            title="Demonstrated competencies"
            rows={passport.competencies.map((row) => ({
              id: row.id,
              type: row.type,
              source: row.source,
              issuer: row.assessorRole,
              identityLinked: true,
              verificationState: row.verificationState,
              expiresAt: null,
              nextAction: row.nextAction,
            }))}
          />

          <section className="space-y-3 rounded-xl border p-4" aria-labelledby="skills-bridge">
            <h2 id="skills-bridge" className="text-lg font-semibold">
              Skills Bridge
            </h2>
            <p className="text-sm text-muted-foreground">
              Structured learning works with AI turned off. AI may explain gaps but cannot
              certify competence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" size="lg" onClick={() => void evaluate(false)}>
                Show structured explanation
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => void evaluate(true)}>
                Optional AI explanation
              </Button>
            </div>
            {explanation ? (
              <div
                className="rounded-lg bg-muted p-3 text-sm"
                role="status"
                aria-live="polite"
              >
                {aiLabel ? <p className="font-semibold">AI explanation. Not a clearance.</p> : null}
                <p className="whitespace-pre-wrap">{explanation}</p>
              </div>
            ) : null}
            <ul className="space-y-2">
              {learning.map((item) => (
                <li key={item.id} className="rounded-lg border p-3">
                  <strong>{item.title}</strong>
                  {item.code ? <span> ({item.code})</span> : null}
                  <p className="text-sm">{item.disclaimer}</p>
                  {item.highIntensity ? (
                    <p className="text-sm font-medium">
                      High-intensity: human professional assessment required.
                    </p>
                  ) : null}
                  {item.url ? (
                    <a className="text-sm underline" href={item.url} rel="noreferrer">
                      Official reference
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
            {passport.gaps.length > 0 ? (
              <ul className="space-y-2">
                {passport.gaps.map((gap) => (
                  <li key={gap.requirementKey} className="rounded-lg border p-3">
                    <strong>{gap.label}</strong> — {gap.state}
                    <p className="text-sm">{gap.copy}</p>
                    <p className="text-sm text-muted-foreground">{gap.nextAction}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="text-lg font-semibold">Renewal and disputes</h2>
            <label className="block text-sm" htmlFor="dispute-reason">
              Why should this record be checked?
            </label>
            <textarea
              id="dispute-reason"
              className="min-h-24 w-full rounded-lg border p-3"
              value={disputeReason}
              onChange={(event) => setDisputeReason(event.target.value)}
            />
            <Button type="button" size="lg" onClick={() => void openDispute()}>
              Request a correction
            </Button>
            {passport.disputes.length > 0 ? (
              <ul>
                {passport.disputes.map((row) => (
                  <li key={row.id}>
                    {row.evidenceKind} — {row.status}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="text-lg font-semibold">Privacy and sharing</h2>
            {(
              [
                ["shareWithProviders", "Share summaries with my provider organisation"],
                ["shareWithParticipants", "Share limited readiness reasons with participants"],
                ["shareScreeningSummary", "Share screening summary (not numbers)"],
                ["shareQualifications", "Share qualifications"],
                ["shareTraining", "Share training records"],
                ["shareCompetencies", "Share demonstrated competencies"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={share[key]}
                  onChange={(event) =>
                    setShare((current) => ({ ...current, [key]: event.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
            <Button type="button" size="lg" onClick={() => void saveShare()}>
              Save sharing preferences
            </Button>
          </section>
        </>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
}

function EvidenceList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    type: string;
    source: string;
    issuer: string | null;
    identityLinked: boolean;
    verificationState: string;
    expiresAt: string | null;
    nextAction: string;
  }>;
}) {
  return (
    <section className="space-y-2 rounded-xl border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p>No records yet. Missing evidence stays unknown, not assumed.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border p-3 text-sm">
              <p>
                <strong>{row.type}</strong> — {row.verificationState}
              </p>
              <p>Source / issuer: {row.issuer || row.source}</p>
              <p>Identity linked: {row.identityLinked ? "yes" : "not confirmed"}</p>
              <p>Expiry: {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("en-AU") : "not set"}</p>
              <p>Next action: {row.nextAction}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
