"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type JourneyResult = {
  destinationSummary: string;
  routeAssumptions: string[];
  transportOptions: { mode: string; note: string }[];
  pickupDropOff: string;
  arrivalBuffer: string;
  returnTripReminder: string;
  supportWorkerOption: string;
  unknowns: string[];
  confidenceScore: number;
};

function buildDemoJourney(input: {
  start: string;
  destination: string;
  mobilityAid: string;
  accessNeeds: string;
  companions: string;
  mode: string;
  appointmentTime: string;
  buffer: string;
  supportWorker: boolean;
  returnTrip: boolean;
}): JourneyResult {
  const modeNotes: Record<string, string> = {
    "public-transport": "Public transport connectivity is estimated only (demo).",
    "wat-taxi": "Wheelchair accessible taxi availability is a placeholder estimate.",
    "community-transport": "Community transport windows are demo assumptions.",
    "support-worker-transport": "Support worker transport depends on provider acceptance.",
  };

  return {
    destinationSummary: `${input.destination || "Destination"} access summary is demo-based. Confirm critical access needs before travelling.`,
    routeAssumptions: [
      `Start: ${input.start || "Not specified"}`,
      `Mobility aid: ${input.mobilityAid || "Not specified"}`,
      `Access needs noted: ${input.accessNeeds || "None entered"}`,
      `Companions: ${input.companions || "None"}`,
      modeNotes[input.mode] ?? "Transport mode assumptions are demo-only.",
    ],
    transportOptions: [
      {
        mode: "Public transport (placeholder)",
        note: "Check stop accessibility and transfer times separately.",
      },
      {
        mode: "Wheelchair accessible taxi (placeholder)",
        note: "Confirm vehicle type, ramp/hoist, and booking lead time.",
      },
      {
        mode: "Community transport (placeholder)",
        note: "May require advance booking and membership eligibility.",
      },
      {
        mode: "Support worker transport (placeholder)",
        note: input.supportWorker
          ? "Include meeting point and handover notes."
          : "Enable support worker needed if this applies.",
      },
    ],
    pickupDropOff:
      "Use a step-free kerbside point where possible. Share exact entrance notes with the driver.",
    arrivalBuffer:
      input.buffer === "high"
        ? "Suggested arrival buffer: 45–60 minutes."
        : input.buffer === "low"
          ? "Suggested arrival buffer: 15–20 minutes."
          : "Suggested arrival buffer: 30 minutes.",
    returnTripReminder: input.returnTrip
      ? `Return trip reminder after appointment (${input.appointmentTime || "time TBC"}).`
      : "No return trip selected.",
    supportWorkerOption: input.supportWorker
      ? "Support worker can meet at the destination entrance (demo option)."
      : "No support worker meeting requested.",
    unknowns: [
      "Live traffic and vehicle availability not queried.",
      "Venue access confidence should be checked on the place page.",
      "Funding eligibility is not assessed by this planner.",
    ],
    confidenceScore: 58,
  };
}

export function JourneyPlannerForm() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [mobilityAid, setMobilityAid] = useState("");
  const [accessNeeds, setAccessNeeds] = useState("");
  const [companions, setCompanions] = useState("");
  const [mode, setMode] = useState("wat-taxi");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [buffer, setBuffer] = useState("medium");
  const [supportWorker, setSupportWorker] = useState(false);
  const [returnTrip, setReturnTrip] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    return buildDemoJourney({
      start,
      destination,
      mobilityAid,
      accessNeeds,
      companions,
      mode,
      appointmentTime,
      buffer,
      supportWorker,
      returnTrip,
    });
  }, [
    submitted,
    start,
    destination,
    mobilityAid,
    accessNeeds,
    companions,
    mode,
    appointmentTime,
    buffer,
    supportWorker,
    returnTrip,
  ]);

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Accessible Journey Planner
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Plan the full journey, not just the pin on a map.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            This planner works as a labelled form and text summary. Map visuals are optional.
            Results use demo assumptions — not live transport APIs.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-2 lg:px-8">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <Field id="jp-start" label="Start location" value={start} onChange={setStart} />
          <Field
            id="jp-destination"
            label="Destination"
            value={destination}
            onChange={setDestination}
          />
          <Field
            id="jp-mobility"
            label="Mobility aid"
            value={mobilityAid}
            onChange={setMobilityAid}
            placeholder="Manual wheelchair, powerchair, walker…"
          />
          <div>
            <label htmlFor="jp-needs" className="text-sm font-semibold">
              Access needs
            </label>
            <textarea
              id="jp-needs"
              className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
              value={accessNeeds}
              onChange={(e) => setAccessNeeds(e.target.value)}
            />
          </div>
          <Field
            id="jp-companions"
            label="Companions"
            value={companions}
            onChange={setCompanions}
          />
          <div>
            <label htmlFor="jp-mode" className="text-sm font-semibold">
              Transport mode
            </label>
            <select
              id="jp-mode"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="public-transport">Public transport (placeholder)</option>
              <option value="wat-taxi">Wheelchair accessible taxi (placeholder)</option>
              <option value="community-transport">Community transport (placeholder)</option>
              <option value="support-worker-transport">
                Support worker transport (placeholder)
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="jp-time" className="text-sm font-semibold">
              Appointment time
            </label>
            <input
              id="jp-time"
              type="datetime-local"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="jp-buffer" className="text-sm font-semibold">
              Buffer preference
            </label>
            <select
              id="jp-buffer"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High (fatigue-aware)</option>
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={supportWorker}
              onChange={(e) => setSupportWorker(e.target.checked)}
            />
            Support worker needed?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={returnTrip}
              onChange={(e) => setReturnTrip(e.target.checked)}
            />
            Return trip needed?
          </label>
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Build demo journey plan
          </button>
        </form>

        <section aria-labelledby="journey-result-heading" className="rounded-2xl border border-slate-200 p-5">
          <h2 id="journey-result-heading" className="text-2xl font-black">
            Journey summary
          </h2>
          {!result ? (
            <p className="mt-3 text-sm text-slate-600">
              Submit the form to see a text summary you can read without a map.
            </p>
          ) : (
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <p className="rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-950">
                Demo plan · confidence {result.confidenceScore}/100
              </p>
              <p>{result.destinationSummary}</p>
              <div>
                <h3 className="font-bold">Route accessibility assumptions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.routeAssumptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold">Transport options</h3>
                <ul className="mt-2 space-y-2">
                  {result.transportOptions.map((option) => (
                    <li key={option.mode} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-semibold">{option.mode}</p>
                      <p>{option.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                <strong>Pickup / drop-off:</strong> {result.pickupDropOff}
              </p>
              <p>
                <strong>Arrival buffer:</strong> {result.arrivalBuffer}
              </p>
              <p>
                <strong>Return trip:</strong> {result.returnTripReminder}
              </p>
              <p>
                <strong>Support worker:</strong> {result.supportWorkerOption}
              </p>
              <div>
                <h3 className="font-bold">Unknowns to confirm</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.unknowns.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Action href="/dashboard" label="Save journey" />
                <Action href="/transport" label="Request transport" />
                <Action href="/care/request" label="Request support worker" />
                <Action
                  href="/support-coordinator"
                  label="Share journey with support coordinator"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
    >
      {label}
    </Link>
  );
}
