import React from "react";

import { AccessFitBadge } from "@/components/access-fit/AccessFitBadge";
import type { AccessFitResult } from "@/lib/access/fit/types";


export function AccessFitBreakdown({ result }: { result: AccessFitResult }) {
  return (
    <section
      aria-labelledby="access-fit-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="access-fit-heading" className="text-lg font-semibold text-[#0C1833]">
          Access-Fit for your needs
        </h2>
        <AccessFitBadge score={result.score} label={result.label} />
      </div>
      <p className="text-sm text-slate-600">
        Compared locally on this device. MapAble does not store your access needs unless
        you choose to save an Access Pass later.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <FitList title="Matches" items={result.matches} empty="No confirmed matches yet." />
        <FitList title="Barriers" items={result.barriers} empty="No confirmed barriers." />
        <FitList title="Unknowns" items={result.unknowns} empty="No unknowns." />
      </div>
    </section>
  );
}

function FitList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#0C1833]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
