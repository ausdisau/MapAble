"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type DecisionPassportPanelProps = {
  passportId?: string | null;
  tenantId?: string | null;
  participantId?: string | null;
  goal?: string | null;
  interpretationSummary?: string | null;
  shortlistLabels?: string[];
  aiInvolved?: boolean;
  aiOptedOut?: boolean;
};

type StatusTone = "idle" | "ok" | "error";

/**
 * Accessible Decision Passport controls — keyboard-first, plain language.
 * No map; no chain-of-thought. Actions call pilot APIs when IDs are present.
 */
export function DecisionPassportPanel({
  passportId = null,
  tenantId = null,
  participantId = null,
  goal = null,
  interpretationSummary = null,
  shortlistLabels = [],
  aiInvolved = false,
  aiOptedOut = false,
}: DecisionPassportPanelProps) {
  const headingId = useId();
  const statusId = useId();
  const [status, setStatus] = useState("Ready. Choose an action below.");
  const [tone, setTone] = useState<StatusTone>("idle");
  const [busy, setBusy] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [optedOut, setOptedOut] = useState(aiOptedOut);

  async function callPassportAction(
    action: "correct" | "challenge" | "reject" | "opt_out",
    extra?: Record<string, unknown>,
  ) {
    if (!passportId || !tenantId || !participantId) {
      setTone("error");
      setStatus(
        "No Decision Passport is loaded yet. You can still continue without AI or request human help.",
      );
      return;
    }

    setBusy(true);
    setTone("idle");
    setStatus("Working…");

    try {
      const res = await fetch(`/api/navigator/pilot/passport/${passportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          participantId,
          action,
          note: correctionNote || undefined,
          ...extra,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        continueVia?: string;
      };
      if (!res.ok) {
        setTone("error");
        setStatus(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      switch (action) {
        case "correct":
          setTone("ok");
          setStatus("Your correction was saved.");
          break;
        case "challenge":
          setTone("ok");
          setStatus("Your challenge was recorded. A human can review it.");
          break;
        case "reject":
          setTone("ok");
          setStatus("The suggestion was rejected.");
          break;
        case "opt_out":
          setOptedOut(true);
          setTone("ok");
          setStatus(
            "AI assistance is turned off for this decision. You can continue with Provider Finder.",
          );
          break;
        default: {
          const _exhaustive: never = action;
          setStatus(String(_exhaustive));
        }
      }
    } catch {
      setTone("error");
      setStatus("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function requestHumanHelp() {
    if (!tenantId || !participantId) {
      setTone("error");
      setStatus("Missing account context. Please sign in again.");
      return;
    }

    setBusy(true);
    setTone("idle");
    setStatus("Requesting human help…");

    try {
      const res = await fetch("/api/navigator/pilot/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          participantId,
          reason: "participant_request",
          passportId: passportId ?? undefined,
          note: correctionNote || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        escalation?: { message?: string; emergencyGuidance?: string | null };
      };
      if (!res.ok) {
        setTone("error");
        setStatus(data.error ?? "Could not reach a human helper right now.");
        return;
      }
      setTone("ok");
      setStatus(
        data.escalation?.message ??
          "A MapAble team member will follow up.",
      );
    } catch {
      setTone("error");
      setStatus("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-md border border-[#1B4F72] bg-white px-4 py-2 text-sm font-medium text-[#0C1833] transition hover:bg-[#E8F1F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72] disabled:cursor-not-allowed disabled:opacity-50";

  const primaryClass =
    "inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163E59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto max-w-2xl space-y-6 rounded-lg border border-[#C5D5E0] bg-white p-6 shadow-sm"
    >
      <header className="space-y-2">
        <h2 id={headingId} className="text-xl font-semibold text-[#0C1833]">
          Your Decision Passport
        </h2>
        <p className="text-sm leading-relaxed text-[#334155]">
          This shows what we understood and the options suggested. You stay in
          control — correct anything, reject an option, turn off AI, or ask a
          person for help.
        </p>
      </header>

      <div className="space-y-3 text-sm text-[#0C1833]">
        <div>
          <h3 className="font-medium">Goal</h3>
          <p className="mt-1 text-[#334155]">
            {goal?.trim() || "No goal recorded yet."}
          </p>
        </div>
        <div>
          <h3 className="font-medium">What we understood</h3>
          <p className="mt-1 text-[#334155]">
            {interpretationSummary?.trim() ||
              "Nothing to show yet. When Navigator runs, a plain summary appears here."}
          </p>
        </div>
        <div>
          <h3 className="font-medium">Suggested options</h3>
          {shortlistLabels.length === 0 ? (
            <p className="mt-1 text-[#334155]">No options listed yet.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[#334155]">
              {shortlistLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-[#334155]">
          AI involved: {aiInvolved ? "Yes" : "No"}
          {optedOut ? " · You have opted out of AI for this decision." : null}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${headingId}-note`} className="block text-sm font-medium text-[#0C1833]">
          Correction or note (optional)
        </label>
        <textarea
          id={`${headingId}-note`}
          value={correctionNote}
          onChange={(e) => setCorrectionNote(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-[#C5D5E0] bg-white px-3 py-2 text-sm text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
          placeholder="Tell us what to change"
        />
      </div>

      <div
        className="flex flex-wrap gap-3"
        role="group"
        aria-label="Decision Passport actions"
      >
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => void callPassportAction("correct")}
        >
          Correct
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => void callPassportAction("reject")}
        >
          Reject option
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy || optedOut}
          onClick={() => void callPassportAction("opt_out")}
        >
          Opt out of AI
        </button>
        <button
          type="button"
          className={primaryClass}
          disabled={busy}
          onClick={() => void requestHumanHelp()}
        >
          Request human help
        </button>
        <Link
          href="/provider-finder"
          className={buttonClass}
        >
          Continue without AI
        </Link>
      </div>

      <p
        id={statusId}
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
  );
}
