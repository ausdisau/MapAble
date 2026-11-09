"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getSignalEvidenceExample,
  projectSignalEvidenceForDay,
  SIGNAL_EVIDENCE_EXAMPLE_IDS,
  type SignalEvidenceExampleId,
} from "@/lib/access/signal/day-evidence-projection";
import {
  makeSignalParticipationChoice,
  SIGNAL_CHALLENGE_IDS,
  SIGNAL_CONTRIBUTOR_ROLES,
  SIGNAL_PARTICIPATION_MODES,
  type SignalChallengeId,
  type SignalContributorRole,
  type SignalDemoTimeSlot,
  type SignalParticipationChoice,
  type SignalParticipationMode,
} from "@/lib/core/signal/participation";

const challengeLabels: Record<SignalChallengeId, string> = {
  journeys: "Connect the Journey",
  entrances: "Every Entrance Counts",
  facilities: "Essential Access",
  sensory: "Quiet, Clear and Welcoming",
  changes: "Is It Still Accessible?",
};
const evidenceLabels: Record<SignalEvidenceExampleId, string> = {
  unknown: "Unknown or not assessed",
  community_reported: "Community report — unverified",
  disputed: "Disputed report",
  feature_verified: "Assessor reviewed one feature — not the whole journey",
};
const modeLabels: Record<SignalParticipationMode, string> = {
  remote: "From home",
  field: "In person (hypothetical)",
  supported: "With my chosen support",
};
const roleLabels: Record<SignalContributorRole, string> = {
  mapper: "Observe a feature",
  researcher: "Review information",
  reviewer: "Check evidence gaps",
};

export function SignalDayParticipationPanel({
  choice,
  onChange,
}: {
  choice: SignalParticipationChoice | null;
  onChange: (choice: SignalParticipationChoice | null) => void;
}) {
  const [challenge, setChallenge] = useState<SignalChallengeId>("journeys");
  const [mode, setMode] = useState<SignalParticipationMode>("remote");
  const [role, setRole] = useState<SignalContributorRole>("researcher");
  const [time, setTime] = useState<SignalDemoTimeSlot>("15:15");
  const [evidenceId, setEvidenceId] = useState<SignalEvidenceExampleId>("unknown");
  const [message, setMessage] = useState("");
  const projection = useMemo(
    () => projectSignalEvidenceForDay(getSignalEvidenceExample(evidenceId)),
    [evidenceId],
  );

  function addLocalChoice() {
    try {
      const draft = makeSignalParticipationChoice({
        challengeId: challenge,
        mode,
        role,
        startTime: time,
        participantReviewed: true,
      });
      onChange(draft);
      setMessage("You added a fictional activity to this screen only. Nothing was booked or shared.");
    } catch {
      setMessage("This example could not be added. Choose a valid combination.");
    }
  }

  function removeLocalChoice() {
    onChange(null);
    setMessage("The fictional activity was removed from your example day.");
  }

  return (
    <section
      className="space-y-4 rounded-2xl border bg-card p-5"
      aria-labelledby="day-signal-heading"
      data-signal-demo="true"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Signal × Core × Access × Day
        </p>
        <h2 className="mt-1 font-heading text-xl font-bold" id="day-signal-heading">
          Add a community mapping activity
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          This is an optional, fictional MapAble Signal activity. You can
          choose a remote or supported option without disclosing a diagnosis,
          enabling location tracking, or accepting any worker or transport booking.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="signal-day-challenge" className="block text-sm font-semibold">Challenge</label>
          <select id="signal-day-challenge" value={challenge} onChange={(event) => setChallenge(event.currentTarget.value as SignalChallengeId)} className="mt-2 min-h-11 w-full rounded-lg border bg-background p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            {SIGNAL_CHALLENGE_IDS.map((id) => (
              <option key={id} value={id}>{challengeLabels[id]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-day-mode" className="block text-sm font-semibold">How would you contribute?</label>
          <select id="signal-day-mode" value={mode} onChange={(event) => setMode(event.currentTarget.value as SignalParticipationMode)} className="mt-2 min-h-11 w-full rounded-lg border bg-background p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            {SIGNAL_PARTICIPATION_MODES.map((id) => (
              <option key={id} value={id}>{modeLabels[id]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-day-role" className="block text-sm font-semibold">Optional role</label>
          <select id="signal-day-role" value={role} onChange={(event) => setRole(event.currentTarget.value as SignalContributorRole)} className="mt-2 min-h-11 w-full rounded-lg border bg-background p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            {SIGNAL_CONTRIBUTOR_ROLES.map((id) => (
              <option key={id} value={id}>{roleLabels[id]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="signal-day-time" className="block text-sm font-semibold">Example time (Sydney time)</label>
          <select id="signal-day-time" value={time} onChange={(event) => setTime(event.currentTarget.value as SignalDemoTimeSlot)} className="mt-2 min-h-11 w-full rounded-lg border bg-background p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            <option value="13:15">13:15–14:00 (illustrative)</option>
            <option value="15:15">15:15–16:00 (illustrative)</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="signal-day-evidence" className="block text-sm font-semibold">Fictional access evidence to review</label>
          <select id="signal-day-evidence" value={evidenceId} onChange={(event) => setEvidenceId(event.currentTarget.value as SignalEvidenceExampleId)} className="mt-2 min-h-11 w-full rounded-lg border bg-background p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            {SIGNAL_EVIDENCE_EXAMPLE_IDS.map((id) => (
              <option key={id} value={id}>{evidenceLabels[id]}</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted-foreground">
            {projection.reason} There is no verified whole-journey suitability.
            The public rating remains Unknown.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-bold">Your control</p>
        <p className="mt-1">
          Preview choices live only in this page. This is not a Core
          ConsentRecord, delegated authority, event registration,
          access verification or published rating. No data goes to an ad platform.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addLocalChoice}
          className="min-h-11 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          {choice ? "Replace my preview choice" : "Add to my example day"}
        </button>
        {choice ? (
          <button type="button" onClick={removeLocalChoice} className="min-h-11 rounded-lg border px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            Remove from my example day
          </button>
        ) : null}
        <Link href="/mapping-days" className="inline-flex min-h-11 items-center rounded-lg border px-4 py-3 text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
          Explore Mapping Days
        </Link>
      </div>
      <p role="status" aria-live="polite" className="text-sm">{message || "No MapAble Signal activity has been added."}</p>
    </section>
  );
}
