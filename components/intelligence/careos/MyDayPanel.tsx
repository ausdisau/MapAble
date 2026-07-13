"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MyDay = {
  appointments: Array<{ id: string; title: string; startAt: string; endAt: string }>;
  careRequestsAwaitingResponse: number;
  transportTripsUpcoming: number;
  pendingRecommendations: number;
};

export function MyDayPanel() {
  const [today, setToday] = useState<MyDay>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/intelligence/careos/my-day")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setMessage(payload.error === "CONSENT_REQUIRED" ? "Permission is needed to show your day." : "My Day is not available right now.");
          return;
        }
        setToday(payload.today);
      })
      .catch(() => setMessage("My Day is not available right now."));
  }, []);

  return (
    <section aria-labelledby="my-day-heading" className="rounded-xl border bg-card p-5">
      <h2 id="my-day-heading" className="font-heading text-xl font-bold">My Day</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your upcoming arrangements and items that may need your attention.
      </p>
      <p className="mt-3 text-sm" aria-live="polite">{message}</p>
      {today ? (
        <div className="mt-4 space-y-3">
          <ul className="space-y-2" aria-label="Upcoming appointments">
            {today.appointments.length > 0 ? today.appointments.map((appointment) => (
              <li key={appointment.id} className="rounded-lg border p-3 text-sm">
                <strong>{appointment.title}</strong>
                <span className="block text-muted-foreground">
                  {new Date(appointment.startAt).toLocaleString()}
                </span>
              </li>
            )) : <li className="text-sm text-muted-foreground">No appointments are scheduled for the next day.</li>}
          </ul>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="font-bold">Care requests</dt><dd>{today.careRequestsAwaitingResponse}</dd></div>
            <div><dt className="font-bold">Transport trips</dt><dd>{today.transportTripsUpcoming}</dd></div>
            <div><dt className="font-bold">Recommendations</dt><dd>{today.pendingRecommendations}</dd></div>
          </dl>
          <Link className="inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40" href="/dashboard/calendar">
            View calendar
          </Link>
        </div>
      ) : null}
    </section>
  );
}
