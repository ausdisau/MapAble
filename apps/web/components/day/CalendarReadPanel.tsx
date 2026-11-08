"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import type { DayCalendarRecord } from "@/lib/day/calendar-read";

type CalendarResponse = {
  day: string;
  timezone: "Australia/Sydney";
  source: "mapable_calendar";
  readOnly: true;
  message: string;
  truncated: boolean;
  events: DayCalendarRecord[];
};

type ReadStatus = "idle" | "loading" | "loaded" | "unavailable";

/**
 * Reads only when a participant explicitly asks. Does not combine unverified
 * calendar records with synthetic readiness scores or pass them to an AI.
 */
export function CalendarReadPanel() {
  const [status, setStatus] = useState<ReadStatus>("idle");
  const [result, setResult] = useState<CalendarResponse | null>(null);
  const requestSequence = useRef(0);

  async function loadToday() {
    const sequence = ++requestSequence.current;
    setStatus("loading");
    setResult(null);

    try {
      const response = await fetch("/api/day/calendar", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("DAY_CALENDAR_UNAVAILABLE");
      const data = (await response.json()) as CalendarResponse;
      if (sequence !== requestSequence.current) return;

      if (!data.readOnly || data.source !== "mapable_calendar" || !Array.isArray(data.events)) {
        throw new Error("INVALID_CALENDAR_RESPONSE");
      }
      setResult(data);
      setStatus("loaded");
    } catch {
      if (sequence !== requestSequence.current) return;
      setResult(null);
      setStatus("unavailable");
    }
  }

  function clearView() {
    // Invalidate any in-flight response, without making remote changes.
    requestSequence.current += 1;
    setResult(null);
    setStatus("idle");
  }

  function localTime(value: string) {
    const timestamp = new Date(value);
    if (!Number.isFinite(timestamp.getTime())) return "Time unavailable";
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(timestamp);
  }

  return (
    <section
      aria-labelledby="mapable-day-calendar-heading"
      className="rounded-2xl border bg-card p-5"
    >
      <h2 id="mapable-day-calendar-heading" className="font-heading text-xl font-bold">
        Your recorded calendar
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Optional read-only view of your MapAble calendar entries starting today
        (Sydney time). We do not load this information unless you request it.
        These records are separate from the invented day above.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          disabled={status === "loading"}
          onClick={() => void loadToday()}
        >
          {status === "loading" ? "Loading calendar…" : "Load my calendar for today"}
        </button>
        <button
          type="button"
          disabled={status === "idle"}
          className="min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-50"
          onClick={clearView}
        >
          Clear this view
        </button>
      </div>
      <div role="status" aria-live="polite" className="mt-3 text-sm">
        {status === "idle" ? "No calendar information has been loaded." : null}
        {status === "loading" ? "Reading your existing calendar records…" : null}
        {status === "unavailable"
          ? "Your calendar could not be loaded. No changes were made."
          : null}
      </div>
      {status === "loaded" && result ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm font-semibold">
            Recorded events starting {result.day} ({result.timezone}):
            {" "}{result.events.length}
          </p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
          {result.events.length > 0 ? (
            <ol className="space-y-2" aria-label="Read-only calendar entries">
              {result.events.map((event) => (
                <li key={event.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-bold">{event.title}</p>
                  <p className="mt-1 text-muted-foreground">
                    {localTime(event.startsAt)} to {localTime(event.endsAt)}
                    {" · "}{event.category.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recorded entry — service, accessibility and attendance not independently verified
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm">No entries starting today were found.</p>
          )}
          {result.truncated ? (
            <p className="text-sm">
              Only part of this day&apos;s calendar may be shown. Open the full
              calendar to check for additional entries.
            </p>
          ) : null}
        </div>
      ) : null}
      <Link
        href="/dashboard/calendar"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      >
        Open the standard calendar instead
      </Link>
    </section>
  );
}
