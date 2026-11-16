"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { RelationalFitDisclosure } from "@/components/support-builder/RelationalFitDisclosure";

import {
  COMMUNICATION_MODES,
  DEFAULT_FIT_REQUEST,
  type ParticipantFitRequest,
} from "@/lib/support-builder/relational-fit";


type Candidate = {
  workerId: string;
  workerName: string;
  organisationName: string;
  declaredServiceTypes: string[];
  localityNote: string;
  lastWorkstyleDeclarationAt: string;
  comparison: {
    alignsWith: string[];
    discussBeforeProceeding: string[];
    unknowns: string[];
    basis: "participant_preferences_and_worker_declarations_only";
  };
  evidenceLimitations: string[];
  selectionStatus: "review_required";
};
type MatchResponse = {
  candidates: Candidate[];
  reason: string;
  humanReviewRequired: boolean;
  modelUsed?: boolean;
  storedParticipantPreferences?: boolean;
};

type Dimension = "routine" | "interaction" | "initiative" | "continuity";
const DIMENSIONS = [
  {
    key: "routine" as const,
    label: "Preferred way of organising routines",
    options: [
      ["any", "No preference"],
      ["structured", "Clear, consistent routine"],
      ["flexible", "Flexible activities and timing"],
    ],
  },
  {
    key: "interaction" as const,
    label: "Preferred interaction style",
    options: [
      ["any", "No preference"],
      ["quiet", "Quiet, low-conversation support"],
      ["conversational", "Enjoy conversation during activities"],
    ],
  },
  {
    key: "initiative" as const,
    label: "How assistance should be offered",
    options: [
      ["any", "No preference"],
      ["ask_first", "Ask me before offering assistance"],
      ["offer_options", "Offer choices for me to consider"],
    ],
  },
  {
    key: "continuity" as const,
    label: "Working arrangement",
    options: [
      ["any", "No preference"],
      ["regular", "Regular familiar worker"],
      ["variable", "Happy with changing workers"],
    ],
  },
];

export function RelationalFitPanel({ locality }: { locality: string }) {
  const titleId = useId();
  const [request, setRequest] = useState<ParticipantFitRequest>(DEFAULT_FIT_REQUEST);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [message, setMessage] = useState("");

  function updateDimension(key: Dimension, value: string, field: "value" | "importance") {
    setRequest((previous) => ({
      ...previous,
      [key]: { ...previous[key], [field]: value },
    }));
    setResult(null);
  }

  async function findOptions() {
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/provider-finder/builder/relational-fit/matches", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, locality }),
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 403) {
        setMessage("Sign in with a participant account to view a private shortlist. No request was submitted.");
        return;
      }
      const payload: unknown = await response.json();
      if (!response.ok) {
        setMessage(
          payload && typeof payload === "object" && "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Worker comparisons are unavailable. No worker was contacted.",
        );
        return;
      }
      setResult(payload as MatchResponse);
    } catch {
      setMessage("The matcher is unavailable. You can still use the Provider Finder or ask for human assistance.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={titleId} className="space-y-4 rounded-xl border border-border bg-card p-3">
      <header>
        <h3 id={titleId} className="font-heading text-base font-semibold">
          Relational Fit — find potential workers
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Compare voluntary working practices against your choices. This is not a
          personality test or a confirmed match. No worker will be contacted.
        </p>
      </header>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Communication methods I require</legend>
        <p className="text-xs text-muted-foreground">
          A required method must be declared by the worker. Select none to leave this open.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COMMUNICATION_MODES.map((mode) => (
            <label key={mode} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={request.communicationModes.includes(mode)}
                onChange={(event) => {
                  setRequest((previous) => ({
                    ...previous,
                    communicationModes: event.target.checked
                      ? [...previous.communicationModes, mode]
                      : previous.communicationModes.filter((value) => value !== mode),
                  }));
                  setResult(null);
                }}
              />
              {mode === "aac" ? "AAC" : mode === "auslan" ? "Auslan" : mode === "easy_read" ? "Easy Read" : mode[0].toUpperCase() + mode.slice(1)}
            </label>
          ))}
        </div>
      </fieldset>

      {DIMENSIONS.map((dimension) => (
        <fieldset key={dimension.key} className="space-y-2 border-t border-border pt-3">
          <legend className="text-sm font-semibold">{dimension.label}</legend>
          <label className="block text-xs text-muted-foreground">
            Choose what you prefer
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground"
              value={request[dimension.key].value}
              onChange={(event) => updateDimension(dimension.key, event.target.value, "value")}
            >
              {dimension.options.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          {request[dimension.key].value !== "any" && (
            <label className="block text-xs text-muted-foreground">
              Importance
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground"
                value={request[dimension.key].importance}
                onChange={(event) => updateDimension(dimension.key, event.target.value, "importance")}
              >
                <option value="preferred">Preferred — a difference is worth discussing</option>
                <option value="essential">Essential — don't include workers without it</option>
              </select>
            </label>
          )}
        </fieldset>
      ))}

      <p className="text-xs text-muted-foreground">
        Approximate locality: {locality.trim() || "not provided"}. Actual coverage
        and availability must be checked independently.
      </p>
      <button
        type="button"
        className="min-h-12 w-full rounded-lg bg-primary px-3 font-semibold text-primary-foreground disabled:opacity-50"
        onClick={() => void findOptions()}
        disabled={busy}
      >
        {busy ? "Checking voluntary workstyle records…" : "Compare potential workers"}
      </button>
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      {result && (
        <div className="space-y-3" role="region" aria-label="Potential worker comparisons">
          <p role="status" className="text-sm">
            {result.candidates.length} potential worker lead{result.candidates.length === 1 ? "" : "s"}.
          </p>
          <p className="text-xs text-muted-foreground">{result.reason}</p>
          {result.candidates.map((candidate) => (
            <article key={candidate.workerId} className="space-y-2 rounded-lg border border-border bg-background p-3">
              <h4 className="text-sm font-semibold">{candidate.workerName}</h4>
              <p className="text-xs text-muted-foreground">{candidate.organisationName}</p>
              {candidate.comparison.alignsWith.length > 0 && (
                <div>
                  <p className="text-xs font-semibold">Declared practices that align</p>
                  <ul className="list-disc pl-5 text-xs">
                    {candidate.comparison.alignsWith.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              {candidate.comparison.discussBeforeProceeding.length > 0 && (
                <div>
                  <p className="text-xs font-semibold">Topics to discuss</p>
                  <ul className="list-disc pl-5 text-xs">
                    {candidate.comparison.discussBeforeProceeding.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              {candidate.comparison.unknowns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold">Unknown information</p>
                  <ul className="list-disc pl-5 text-xs">
                    {candidate.comparison.unknowns.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{candidate.localityNote}</p>
              <p className="text-xs text-muted-foreground">
                Declared support types: {candidate.declaredServiceTypes.join(", ") || "not supplied"}.
              </p>
              <p className="text-xs text-muted-foreground">
                Workstyle record last updated: {candidate.lastWorkstyleDeclarationAt.slice(0, 10)}.
              </p>
              <details className="text-xs">
                <summary className="min-h-11 cursor-pointer py-3 font-semibold">Checks still required</summary>
                <ul className="list-disc pl-5">
                  {candidate.evidenceLimitations.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </details>
              <p className="text-xs font-medium">Human review required; no assignment or invitation sent.</p>
            </article>
          ))}
        </div>
      )}
      <RelationalFitDisclosure />
      <p className="text-xs text-muted-foreground">
        Workers may volunteer and withdraw their profile using the
        {" "}<Link href="/provider-finder/builder/worker-profile" className="text-primary underline">
          worker workstyle settings
        </Link>.
      </p>
    </section>
  );
}
