"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { DecisionPassportPanel } from "@/components/navigator/DecisionPassportPanel";
import type { HardConstraintKey } from "@/lib/ai/navigator/matching/types";

export type NavigatorPilotJourneyProps = {
  tenantId: string;
  participantId: string;
};

type Step = "goal" | "confirm" | "constraints" | "results" | "draft" | "done";

type InterpretationFilters = {
  q?: string;
  location?: string;
  service?: string;
  access?: string;
  provider?: string;
  state?: string;
  postcode?: string;
};

type ReviewedInterpretation = {
  sourceQuery: string;
  filters: InterpretationFilters;
  confidence: number;
  engineId: string;
  awaitingConfirmation: boolean;
  modelAssisted: boolean;
};

type ShortlistEntry = {
  provider: { id: string; name: string; sponsored?: boolean };
  score: number;
  materialFactors: string[];
};

type SearchResult = {
  status: string;
  interpretation: ReviewedInterpretation;
  match: {
    status: string;
    shortlist: ShortlistEntry[];
    limitations: string[];
    eliminatedByConstraint: Record<string, number>;
  } | null;
  draftEnvelopeId: string | null;
  transferEnvelopeId: string | null;
  passportId: string | null;
  reason?: string;
};

const PERMITTED_FIELD_OPTIONS = [
  { id: "location", label: "Location" },
  { id: "serviceType", label: "Service type" },
  { id: "accessibility", label: "Accessibility needs" },
  { id: "communication", label: "Communication needs" },
] as const;

const NON_NEGOTIABLE_OPTIONS: Array<{
  id: HardConstraintKey;
  label: string;
}> = [
  { id: "serviceType", label: "Service type" },
  { id: "state", label: "State" },
  { id: "postcode", label: "Postcode" },
  { id: "exclusions", label: "Provider exclusions" },
  { id: "accessibilityRequirements", label: "Accessibility requirements" },
  { id: "communicationRequirements", label: "Communication requirements" },
];

/**
 * Participant-controlled Navigator pilot journey.
 * Goal → interpret confirm → non-negotiables → shortlist → draft edit → Finder transfer.
 * Never books or pays.
 */
export function NavigatorPilotJourney({
  tenantId,
  participantId,
}: NavigatorPilotJourneyProps) {
  const baseId = useId();
  const [step, setStep] = useState<Step>("goal");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    "Start with your goal. Nothing is booked from this page.",
  );
  const [tone, setTone] = useState<"idle" | "ok" | "error">("idle");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [goalText, setGoalText] = useState("");
  const [aiOptedOut, setAiOptedOut] = useState(false);
  const [interpretation, setInterpretation] =
    useState<ReviewedInterpretation | null>(null);
  const [serviceType, setServiceType] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [nonNegotiableKeys, setNonNegotiableKeys] = useState<
    HardConstraintKey[]
  >(["serviceType"]);
  const [permittedFields, setPermittedFields] = useState<string[]>([
    "location",
    "serviceType",
  ]);
  const [transferFilters, setTransferFilters] = useState(true);
  const [saveDraft, setSaveDraft] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [draftPayloadText, setDraftPayloadText] = useState("");
  const [activeEnvelopeId, setActiveEnvelopeId] = useState<string | null>(null);
  const [finderPath, setFinderPath] = useState<string | null>(null);
  const [escalationMessage, setEscalationMessage] = useState<string | null>(
    null,
  );
  const [memoryNote, setMemoryNote] = useState<string | null>(null);

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-md border border-[#1B4F72] bg-white px-4 py-2 text-sm font-medium text-[#0C1833] transition hover:bg-[#E8F1F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72] disabled:cursor-not-allowed disabled:opacity-50";
  const primaryClass =
    "inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163E59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72] disabled:cursor-not-allowed disabled:opacity-50";

  function setError(message: string) {
    setTone("error");
    setStatus(message);
  }

  function setOk(message: string) {
    setTone("ok");
    setStatus(message);
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/navigator/pilot/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, participantId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      sessionId?: string;
      error?: string;
    };
    if (!res.ok || !data.sessionId) {
      setError(data.error ?? "Could not start a Navigator session.");
      return null;
    }
    setSessionId(data.sessionId);
    return data.sessionId;
  }

  async function interpretGoal() {
    if (!goalText.trim()) {
      setError("Please enter a short goal first.");
      return;
    }
    setBusy(true);
    setTone("idle");
    setStatus("Understanding your goal…");
    try {
      const sid = await ensureSession();
      if (!sid) return;

      const res = await fetch("/api/navigator/pilot/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          participantId,
          goalText: goalText.trim(),
          aiOptedOut,
          hardConstraints: {
            requiredServices: [],
            exclusions: [],
            communicationRequirements: [],
            accessibilityRequirements: [],
            credentialRequirements: [],
            nonNegotiableKeys: [],
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
        interpretation?: ReviewedInterpretation;
      };
      if (!res.ok || !data.interpretation) {
        setError(data.error ?? "Could not interpret your goal.");
        return;
      }
      const interp = data.interpretation;
      setInterpretation(interp);
      setServiceType(interp.filters.service ?? "");
      setState(interp.filters.state ?? "");
      setPostcode(interp.filters.postcode ?? "");
      setStep("confirm");
      setOk("Please confirm what we understood before we search.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    setBusy(true);
    setTone("idle");
    setStatus("Searching with your hard constraints…");
    try {
      const sid = await ensureSession();
      if (!sid) return;

      const exclusionList = exclusions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/navigator/pilot/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          participantId,
          sessionId: sid,
          goalText: goalText.trim(),
          interpretationConfirmed: true,
          aiOptedOut,
          permittedFields,
          transferFilters,
          saveDraft,
          structuredFilters: {
            q: interpretation?.filters.q ?? goalText.trim(),
            location: interpretation?.filters.location,
            service: serviceType || interpretation?.filters.service,
            access: interpretation?.filters.access,
            provider: interpretation?.filters.provider,
            state: state || undefined,
            postcode: postcode || undefined,
          },
          hardConstraints: {
            serviceType: serviceType || undefined,
            state: state || undefined,
            postcode: postcode || undefined,
            exclusions: exclusionList,
            requiredServices: [],
            communicationRequirements: [],
            accessibilityRequirements: [],
            credentialRequirements: [],
            nonNegotiableKeys,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        result?: SearchResult;
      };
      if (!res.ok || !data.result) {
        setError(data.error ?? "Search could not complete.");
        return;
      }
      setResult(data.result);
      const envelopeId =
        data.result.transferEnvelopeId ?? data.result.draftEnvelopeId;
      setActiveEnvelopeId(envelopeId);
      if (envelopeId) {
        await loadEnvelopeDraft(envelopeId);
        setStep("draft");
        setOk(
          data.result.status === "NO_SAFE_MATCH"
            ? "No safe match found. You can still edit the draft transfer or ask for human help."
            : "Shortlist ready. Review the draft before transferring filters.",
        );
      } else {
        setStep("results");
        setOk(
          data.result.status === "NO_SAFE_MATCH"
            ? "No safe match. Refine constraints or request human help."
            : "Shortlist ready. You can request human help or continue without AI.",
        );
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function loadEnvelopeDraft(envelopeId: string) {
    const res = await fetch(
      `/api/navigator/pilot/envelopes/${envelopeId}?tenantId=${encodeURIComponent(tenantId)}&participantId=${encodeURIComponent(participantId)}`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      envelope?: { payload?: Record<string, unknown> };
      error?: string;
    };
    if (res.ok && data.envelope?.payload) {
      setDraftPayloadText(JSON.stringify(data.envelope.payload, null, 2));
    }
  }

  async function saveDraftEdits() {
    if (!activeEnvelopeId) return;
    setBusy(true);
    try {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(draftPayloadText) as Record<string, unknown>;
      } catch {
        setError("Draft text must be valid JSON.");
        return;
      }
      const res = await fetch(
        `/api/navigator/pilot/envelopes/${activeEnvelopeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, participantId, payload }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save draft edits.");
        return;
      }
      setOk("Draft updated. Approve to transfer filters, or reject.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function decideEnvelope(decision: "approve" | "reject") {
    if (!activeEnvelopeId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/navigator/pilot/envelopes/${activeEnvelopeId}/decide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            participantId,
            decision,
            reason:
              decision === "approve"
                ? "participant_approved_transfer"
                : "participant_rejected_transfer",
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        envelope?: {
          executionResult?: { finderPath?: string };
        };
      };
      if (!res.ok) {
        setError(data.error ?? `Could not ${decision} the draft.`);
        return;
      }
      if (decision === "approve") {
        const path = data.envelope?.executionResult?.finderPath ?? null;
        setFinderPath(path);
        setStep("done");
        setOk(
          path
            ? "Filters transferred. Continue in Provider Finder when ready."
            : "Draft approved. No booking was made.",
        );
      } else {
        setStep("results");
        setOk("Draft rejected. You can refine and search again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function requestHumanHelp() {
    setBusy(true);
    try {
      const res = await fetch("/api/navigator/pilot/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          participantId,
          reason: "participant_request",
          sessionId: sessionId ?? undefined,
          passportId: result?.passportId ?? undefined,
          note: goalText.slice(0, 500) || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        escalation?: { message?: string; id?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Could not request human help.");
        return;
      }
      setEscalationMessage(
        data.escalation?.message ?? "A MapAble team member will follow up.",
      );
      setOk("Human help requested.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function checkMemoryStatus() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/navigator/pilot/memory?tenantId=${encodeURIComponent(tenantId)}&participantId=${encodeURIComponent(participantId)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: unknown[];
      };
      if (!res.ok) {
        setMemoryNote(
          data.error === "NAVIGATOR_MEMORY_DISABLED"
            ? "Governed memory is off in this environment."
            : (data.error ?? "Memory status unavailable."),
        );
        return;
      }
      const count = Array.isArray(data.items) ? data.items.length : 0;
      setMemoryNote(
        count === 0
          ? "No governed memory items stored for this purpose."
          : `${count} governed memory item(s) on file. You can withdraw them anytime.`,
      );
    } catch {
      setMemoryNote("Could not load memory status.");
    } finally {
      setBusy(false);
    }
  }

  function toggleNonNegotiable(key: HardConstraintKey) {
    setNonNegotiableKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function togglePermittedField(field: string) {
    setPermittedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }

  const shortlistLabels =
    result?.match?.shortlist.map((s) => s.provider.name) ?? [];

  return (
    <div className="space-y-6">
      <section
        aria-labelledby={`${baseId}-journey`}
        className="space-y-4 rounded-lg border border-[#C5D5E0] bg-white p-6"
      >
        <header className="space-y-2">
          <h2
            id={`${baseId}-journey`}
            className="text-xl font-semibold text-[#0C1833]"
          >
            Guided provider search
          </h2>
          <p className="text-sm leading-relaxed text-[#334155]">
            You confirm each step. Hard constraints are never quietly dropped.
            No booking or payment happens here.
          </p>
          <p className="text-xs text-[#475569]">
            Step:{" "}
            <span className="font-medium text-[#0C1833]">
              {step === "goal"
                ? "1 · Goal"
                : step === "confirm"
                  ? "2 · Confirm interpretation"
                  : step === "constraints"
                    ? "3 · Non-negotiables"
                    : step === "results"
                      ? "4 · Shortlist"
                      : step === "draft"
                        ? "5 · Review draft"
                        : "6 · Done"}
            </span>
          </p>
        </header>

        {step === "goal" ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${baseId}-goal`}
                className="block text-sm font-medium text-[#0C1833]"
              >
                What are you looking for?
              </label>
              <textarea
                id={`${baseId}-goal`}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-[#C5D5E0] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
                placeholder="Example: support worker near Parramatta with wheelchair access"
              />
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-[#0C1833]">
              <input
                type="checkbox"
                checked={aiOptedOut}
                onChange={(e) => setAiOptedOut(e.target.checked)}
              />
              Prefer no AI assistance (rules-only interpretation)
            </label>
            <button
              type="button"
              className={primaryClass}
              disabled={busy}
              onClick={() => void interpretGoal()}
            >
              Continue
            </button>
          </div>
        ) : null}

        {step === "confirm" && interpretation ? (
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-[#334155]">
              <p>
                <span className="font-medium text-[#0C1833]">
                  We understood:
                </span>{" "}
                {interpretation.sourceQuery || goalText}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {interpretation.filters.service ? (
                  <li>Service: {interpretation.filters.service}</li>
                ) : null}
                {interpretation.filters.location ? (
                  <li>Location: {interpretation.filters.location}</li>
                ) : null}
                {interpretation.filters.access ? (
                  <li>Access: {interpretation.filters.access}</li>
                ) : null}
              </ul>
              <p>
                AI involved:{" "}
                {interpretation.modelAssisted && !aiOptedOut ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryClass}
                disabled={busy}
                onClick={() => {
                  setStep("constraints");
                  setOk("Mark what must not be compromised, then search.");
                }}
              >
                Looks right — set constraints
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => {
                  setStep("goal");
                  setOk("Edit your goal and try again.");
                }}
              >
                Correct goal
              </button>
            </div>
          </div>
        ) : null}

        {step === "constraints" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${baseId}-service`}
                  className="block text-sm font-medium"
                >
                  Service type
                </label>
                <input
                  id={`${baseId}-service`}
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#C5D5E0] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
                />
              </div>
              <div>
                <label
                  htmlFor={`${baseId}-state`}
                  className="block text-sm font-medium"
                >
                  State
                </label>
                <input
                  id={`${baseId}-state`}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#C5D5E0] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
                  placeholder="NSW"
                />
              </div>
              <div>
                <label
                  htmlFor={`${baseId}-postcode`}
                  className="block text-sm font-medium"
                >
                  Postcode
                </label>
                <input
                  id={`${baseId}-postcode`}
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#C5D5E0] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
                />
              </div>
              <div>
                <label
                  htmlFor={`${baseId}-exclusions`}
                  className="block text-sm font-medium"
                >
                  Exclude providers (comma-separated)
                </label>
                <input
                  id={`${baseId}-exclusions`}
                  value={exclusions}
                  onChange={(e) => setExclusions(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#C5D5E0] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#0C1833]">
                Non-negotiable (cannot be quietly dropped)
              </legend>
              {NON_NEGOTIABLE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex min-h-11 items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={nonNegotiableKeys.includes(opt.id)}
                    onChange={() => toggleNonNegotiable(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#0C1833]">
                Personal information this search may use
              </legend>
              {PERMITTED_FIELD_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex min-h-11 items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={permittedFields.includes(opt.id)}
                    onChange={() => togglePermittedField(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>

            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={transferFilters}
                onChange={(e) => setTransferFilters(e.target.checked)}
              />
              Prepare a draft transfer of filters to Provider Finder
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveDraft}
                onChange={(e) => setSaveDraft(e.target.checked)}
              />
              Also prepare a draft service request (still no booking)
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryClass}
                disabled={busy}
                onClick={() => void runSearch()}
              >
                Search with these constraints
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => void requestHumanHelp()}
              >
                Request human help instead
              </button>
            </div>
          </div>
        ) : null}

        {(step === "results" || step === "draft" || step === "done") &&
        result ? (
          <div className="space-y-3 text-sm text-[#334155]">
            <p className="font-medium text-[#0C1833]">
              Result:{" "}
              {result.status === "NO_SAFE_MATCH"
                ? "No safe match"
                : result.status === "matched"
                  ? "Shortlist ready"
                  : result.status}
            </p>
            {result.match?.shortlist.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {result.match.shortlist.map((entry) => (
                  <li key={entry.provider.id}>
                    {entry.provider.name}
                    {entry.provider.sponsored ? " (sponsored listing)" : ""}
                    {entry.materialFactors.length
                      ? ` — ${entry.materialFactors.slice(0, 2).join("; ")}`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No providers listed.</p>
            )}
            {result.match?.limitations?.length ? (
              <p>Limitations: {result.match.limitations.join("; ")}</p>
            ) : null}
          </div>
        ) : null}

        {step === "draft" ? (
          <div className="space-y-3">
            <label
              htmlFor={`${baseId}-draft`}
              className="block text-sm font-medium"
            >
              Edit draft before approval (JSON)
            </label>
            <textarea
              id={`${baseId}-draft`}
              value={draftPayloadText}
              onChange={(e) => setDraftPayloadText(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-[#C5D5E0] px-3 py-2 font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => void saveDraftEdits()}
              >
                Save draft edits
              </button>
              <button
                type="button"
                className={primaryClass}
                disabled={busy}
                onClick={() => void decideEnvelope("approve")}
              >
                Approve transfer
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => void decideEnvelope("reject")}
              >
                Reject draft
              </button>
            </div>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="space-y-3">
            {finderPath ? (
              <p>
                <Link href={finderPath} className={primaryClass}>
                  Open Provider Finder with transferred filters
                </Link>
              </p>
            ) : (
              <p>
                <Link href="/provider-finder" className={primaryClass}>
                  Continue to Provider Finder
                </Link>
              </p>
            )}
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => {
                setStep("goal");
                setResult(null);
                setActiveEnvelopeId(null);
                setFinderPath(null);
                setOk("Ready for another goal.");
              }}
            >
              Start again
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-[#E2E8F0] pt-4">
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() => void requestHumanHelp()}
          >
            Request human help
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() => void checkMemoryStatus()}
          >
            Check memory status
          </button>
          <Link href="/provider-finder" className={buttonClass}>
            Continue without AI
          </Link>
        </div>

        {escalationMessage ? (
          <p className="text-sm text-[#146C43]" role="status">
            Escalation: {escalationMessage}
          </p>
        ) : null}
        {memoryNote ? (
          <p className="text-sm text-[#334155]" role="status">
            Memory: {memoryNote}
          </p>
        ) : null}

        <p
          role="status"
          aria-live="polite"
          className={
            tone === "error"
              ? "text-sm text-[#9B1C1C]"
              : tone === "ok"
                ? "text-sm text-[#146C43]"
                : "text-sm text-[#334155]"
          }
        >
          {status}
        </p>
      </section>

      <DecisionPassportPanel
        passportId={result?.passportId}
        tenantId={tenantId}
        participantId={participantId}
        goal={goalText}
        interpretationSummary={
          interpretation?.sourceQuery ?? result?.interpretation.sourceQuery
        }
        shortlistLabels={shortlistLabels}
        aiInvolved={Boolean(interpretation?.modelAssisted && !aiOptedOut)}
        aiOptedOut={aiOptedOut}
      />
    </div>
  );
}
