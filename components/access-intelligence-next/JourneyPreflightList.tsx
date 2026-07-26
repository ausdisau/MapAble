import type { DoorToRoomPreflight } from "@/lib/access/intelligence-next/journey/segments";

type Props = {
  preflight: DoorToRoomPreflight;
};

/**
 * Accessible step list for door-to-room preflight.
 * Essential journey information must not require a map or chat.
 */
export function JourneyPreflightList({ preflight }: Props) {
  return (
    <div className="space-y-6 text-[#0C1833]">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Door-to-room journey steps</h2>
        <p className="text-sm text-slate-600">
          Overall conclusion: <strong>{preflight.overallConclusion}</strong>. Synthetic evaluation —
          not a guarantee of real-world access.
        </p>
      </header>

      <ol className="list-decimal space-y-4 pl-5">
        {preflight.segments.map((s) => (
          <li key={s.id} className="pl-1">
            <p className="font-medium">
              {s.label}{" "}
              <span className="text-sm font-normal text-slate-600">({s.kind})</span>
            </p>
            <p className="text-sm text-slate-700">{s.geometrySummary}</p>
            <p className="text-xs text-slate-500">
              Fit: {s.personalFit}; operational: {s.operationalState}; evidence:{" "}
              {s.evidenceClass}
            </p>
            {s.confirmationQuestion ? (
              <p className="mt-1 text-sm text-amber-900">Confirm: {s.confirmationQuestion}</p>
            ) : null}
            {s.burdenNotes.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                {s.burdenNotes.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      <section aria-labelledby="deps-heading">
        <h3 id="deps-heading" className="text-lg font-semibold">
          Fragile dependencies
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {preflight.dependencyGraph.singlePointsOfFailure.map((spof) => (
            <li key={spof}>Single point of failure: {spof}</li>
          ))}
          {preflight.dependencyGraph.unverifiedFallbacks.map((f) => (
            <li key={f}>Unverified fallback: {f}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="burden-heading">
        <h3 id="burden-heading" className="text-lg font-semibold">
          System-imposed burden
        </h3>
        <p className="mt-2 text-sm text-slate-700">{preflight.burden.summary}</p>
        <p className="text-xs text-slate-500">
          Attributed to: {preflight.burden.attributedTo.join(", ")} — never a participant
          complexity score.
        </p>
      </section>
    </div>
  );
}
