"use client";

import Link from "next/link";
import { useState } from "react";

import {
  EMPTY_CRITERIA,
  FICTIONAL_WORKERS,
  reviewFictionalWorker,
  type CommunicationNeed,
  type Competency,
  type ParticipantCriteria,
  type TimeWindow,
} from "@/lib/matching/participant-preview";

const COMMUNICATION: { value: CommunicationNeed; label: string }[] = [
  { value: "aac", label: "AAC or text-based communication" },
  { value: "extra_time", label: "Extra time to respond" },
  { value: "auslan", label: "Auslan communication" },
  { value: "spoken", label: "Spoken communication" },
];
const COMPETENCIES: { value: Competency; label: string }[] = [
  { value: "personal_care", label: "Personal care" },
  { value: "aac_support", label: "AAC support" },
  { value: "manual_handling", label: "Manual handling and transfers" },
  { value: "high_intensity", label: "High-intensity support (specialist evidence required)" },
];
const TIMES: { value: TimeWindow | "unspecified"; label: string }[] = [
  { value: "unspecified", label: "No preferred time" },
  { value: "weekday_morning", label: "Weekday mornings" },
  { value: "weekday_afternoon", label: "Weekday afternoons" },
  { value: "evening", label: "Evenings" },
  { value: "weekend", label: "Weekends" },
];

function toggle<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

const inputClass = "min-h-11 rounded-lg border border-slate-400 px-4 py-2 text-[#0C1833] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50";

export function ParticipantMatchingPreview() {
  const [criteria, setCriteria] = useState<ParticipantCriteria>({ ...EMPTY_CRITERIA });
  const [discussionList, setDiscussionList] = useState<string[]>([]);
  const reviews = FICTIONAL_WORKERS.map((worker) => reviewFictionalWorker(criteria, worker));
  const selectedNames = reviews.filter((item) => discussionList.includes(item.workerId)).map((item) => item.label);

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-bold text-[#0C1833]">Explore worker matching</h1>
        <p className="max-w-3xl text-slate-700">
          Try a participant-controlled matching experience using entirely fictional
          records. Your choices stay in this browser session; they are not saved,
          sent to workers, used for AI inference, or submitted as bookings.
        </p>
        <p role="status" className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 font-semibold text-[#0C1833]">
          DEMO ONLY: no worker is real or available through this page. Even a
          fictional &ldquo;Clearance&rdquo; label is not verified NDIS worker screening.
        </p>
      </header>

      <section aria-labelledby="match-criteria-heading" className="space-y-5 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
        <h2 id="match-criteria-heading" className="text-xl font-bold">What matters to me</h2>
        <fieldset className="space-y-2">
          <legend className="font-semibold">Communication access</legend>
          <p className="text-sm text-slate-700">Choose every method a worker should be able to support.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {COMMUNICATION.map((item) => (
              <label key={item.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[#005B7F]"
                  checked={criteria.communicationNeeds.includes(item.value)}
                  onChange={() => setCriteria((current) => ({
                    ...current,
                    communicationNeeds: toggle(current.communicationNeeds, item.value),
                  }))}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-semibold">Support competencies</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {COMPETENCIES.map((item) => (
              <label key={item.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[#005B7F]"
                  checked={criteria.requiredCompetencies.includes(item.value)}
                  onChange={() => setCriteria((current) => ({
                    ...current,
                    requiredCompetencies: toggle(current.requiredCompetencies, item.value),
                  }))}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="max-w-lg space-y-2">
          <label htmlFor="match-time" className="block font-semibold">Preferred time</label>
          <select
            id="match-time"
            className={inputClass + " w-full bg-white"}
            value={criteria.preferredWindow}
            onChange={(event) => setCriteria((current) => ({
              ...current,
              preferredWindow: event.target.value as TimeWindow | "unspecified",
            }))}
          >
            {TIMES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </div>

        <button
          type="button"
          className={inputClass + " bg-white font-semibold"}
          onClick={() => { setCriteria({ ...EMPTY_CRITERIA }); setDiscussionList([]); }}
        >
          Reset the preview
        </button>
      </section>

      <section aria-labelledby="fictional-candidates-heading" className="space-y-4">
        <h2 id="fictional-candidates-heading" className="text-2xl font-bold">Fictional worker records</h2>
        <p className="text-slate-700">
          These examples are neither ranked nor endorsed. Every factor states its
          evidence limitations. Select a fictional worker only for a discussion list.
        </p>
        <div className="grid gap-4">
          {reviews.map((review) => {
            const familiar = criteria.familiarWorkerIds.includes(review.workerId);
            const excluded = criteria.excludedWorkerIds.includes(review.workerId);
            const selected = discussionList.includes(review.workerId);
            return (
              <article key={review.workerId} className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
                <h3 className="text-xl font-bold text-[#0C1833]">{review.label}</h3>
                <p className="font-semibold text-[#0C1833]">
                  {review.discussionOnly ? "Discussion only — checks required" : "Do not progress in this scenario"}
                </p>
                <p className="text-sm text-slate-700">
                  Fictional screening: {review.screeningLabel}. Actual clearance:
                  not independently verified. Availability and competencies:
                  not independently verified.
                </p>
                <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                  {review.factors.map((factor) => (
                    <div key={factor.topic} className="p-3">
                      <dt className="font-semibold">
                        {factor.topic}: {factor.state.replaceAll("_", " ")}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">{factor.explanation}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    aria-pressed={familiar}
                    className={inputClass + " bg-white font-semibold"}
                    onClick={() => setCriteria((current) => ({
                      ...current,
                      familiarWorkerIds: toggle(current.familiarWorkerIds, review.workerId),
                    }))}
                  >
                    {familiar ? "Unmark familiar" : "Mark familiar (demo)"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={excluded}
                    className={inputClass + " bg-white font-semibold"}
                    onClick={() => {
                      setCriteria((current) => ({
                        ...current,
                        excludedWorkerIds: toggle(current.excludedWorkerIds, review.workerId),
                      }));
                      setDiscussionList((current) => current.filter((id) => id !== review.workerId));
                    }}
                  >
                    {excluded ? "Undo do-not-consider" : "Do not consider"}
                  </button>
                  <button
                    type="button"
                    disabled={!review.discussionOnly}
                    aria-pressed={selected}
                    className={inputClass + " bg-[#005B7F] font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-800"}
                    onClick={() => setDiscussionList((current) => toggle(current, review.workerId))}
                  >
                    {selected ? "Remove from discussion list" : "Add to discussion list"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="discussion-list-heading" className="space-y-2 rounded-xl border border-slate-300 bg-white p-4">
        <h2 id="discussion-list-heading" className="text-xl font-bold">My discussion list</h2>
        <p role="status" aria-live="polite">
          {selectedNames.length
            ? selectedNames.join("; ") + ". Not saved or shared."
            : "You have not selected any fictional workers."}
        </p>
        <p className="text-sm text-slate-700">
          This is not worker approval, a screening verification or a booking. You
          retain the final decision, with human review for safety-critical needs.
        </p>
      </section>

      <section aria-labelledby="verified-finder-heading" className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
        <h2 id="verified-finder-heading" className="text-xl font-bold">Find and verify real services separately</h2>
        <p className="text-slate-700">
          Provider directories identify organisations, not cleared or available
          individual workers. Check provider registration separately from an
          individual worker&apos;s NDIS screening status.
        </p>
        <ul className="list-disc space-y-3 pl-6">
          <li><Link href="/dashboard/find-support" className="font-semibold underline underline-offset-4">MapAble provider search</Link> — provider-level listings and their stated evidence only.</li>
          <li><a href="https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder" className="font-semibold underline underline-offset-4" target="_blank" rel="noopener noreferrer">Official NDIS Provider Finder (opens new tab)</a> — registered provider search.</li>
          <li><a href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider" className="font-semibold underline underline-offset-4" target="_blank" rel="noopener noreferrer">NDIS Commission Provider Register (opens new tab)</a> — registration status and ABN checks.</li>
          <li><a href="https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants" className="font-semibold underline underline-offset-4" target="_blank" rel="noopener noreferrer">Official worker screening verification instructions (opens new tab)</a> — authorised portal access; screening is not publicly searchable.</li>
        </ul>
        <p className="text-sm text-slate-700">
          If no suitably evidenced worker is available, request human assistance
          instead of accepting an unverified automated substitution.
          <Link href="/dashboard/safety" className="ml-1 font-semibold underline underline-offset-4">Get help</Link>.
        </p>
      </section>
    </div>
  );
}
