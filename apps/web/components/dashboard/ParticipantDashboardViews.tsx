"use client";

import Link from "next/link";
import { useState } from "react";

import { MyDayPanel } from "@/components/intelligence/careos/MyDayPanel";
import {
  getParticipantContextActions,
  type ParticipantContextCounts,
} from "@/lib/dashboard/participant-context";

export function ParticipantDashboardViews({
  counts,
  careOsEnabled,
}: {
  counts: ParticipantContextCounts;
  careOsEnabled: boolean;
}) {
  const [view, setView] = useState<"programmatic" | "assisted">("programmatic");
  const actions = getParticipantContextActions(counts);

  return (
    <section aria-labelledby="dashboard-context-heading" className="space-y-4">
      <div>
        <h2 id="dashboard-context-heading" className="text-2xl font-bold">
          What would you like to do?
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          Choose a view. Your bookings and sharing permissions do not change.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dashboard view">
        <button
          type="button"
          aria-pressed={view === "programmatic"}
          onClick={() => setView("programmatic")}
          className={
            "min-h-11 rounded-lg border px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50 " +
            (view === "programmatic"
              ? "border-[#005B7F] bg-[#005B7F] text-white"
              : "border-slate-400 bg-white text-[#0C1833]")
          }
        >
          Programmatic view
        </button>
        <button
          type="button"
          aria-pressed={view === "assisted"}
          onClick={() => setView("assisted")}
          className={
            "min-h-11 rounded-lg border px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50 " +
            (view === "assisted"
              ? "border-[#005B7F] bg-[#005B7F] text-white"
              : "border-slate-400 bg-white text-[#0C1833]")
          }
        >
          AI-assisted view
        </button>
      </div>
      {view === "programmatic" ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            These suggestions are simple rules based on your own MapAble
            records. They are not AI matches or confirmed worker availability.
          </p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {actions.map((action) => (
              <li key={action.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-lg font-bold text-[#0C1833]">{action.title}</h3>
                <p className="mt-1 text-sm text-slate-700">{action.explanation}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Why shown: {action.evidence}
                </p>
                <Link
                  href={action.href}
                  className="mt-3 inline-flex min-h-11 items-center rounded-md font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50"
                >
                  Open {action.title.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-bold text-[#0C1833]">Optional CareOS assistance</h3>
          {careOsEnabled ? (
            <>
              <p className="text-sm text-slate-700">
                CareOS can show a consent-gated, read-only summary of your
                arrangements. Its summaries do not book shifts, select workers,
                change your permissions or replace a human decision.
              </p>
              <MyDayPanel />
              <Link
                href="/dashboard/careos"
                className="inline-flex min-h-11 items-center rounded-lg border border-[#005B7F] px-4 py-2 font-semibold text-[#005B7F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50"
              >
                Open My CareOS
              </Link>
            </>
          ) : (
            <p role="status" className="text-sm text-slate-700">
              AI assistance is not enabled for this workspace. Your normal
              dashboard and human support options remain available.
            </p>
          )}
          <p className="text-sm text-slate-700">
            To ask a person for help, use{" "}
            <Link className="font-semibold underline" href="/dashboard/safety">
              Help and safety
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );
}
