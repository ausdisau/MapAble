import {
  ACCESSCAST_STATE_DEFINITIONS,
  type AccessCastResult,
} from "@/lib/accesscast";

type Props = {
  result: AccessCastResult;
  showTimeline?: boolean;
  showEvidence?: boolean;
};

/**
 * Accessible Access Outlook card — text-first, never colour-only state.
 */
export function AccessCastCard({ result, showTimeline = true, showEvidence = true }: Props) {
  const stateDescId = `accesscast-state-def-${result.forecastId}`;

  return (
    <article
      aria-labelledby={`accesscast-title-${result.forecastId}`}
      className="space-y-6 rounded-lg border border-slate-300 bg-white p-6 shadow-sm"
    >
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
          Synthetic fixture — not a production claim
        </p>
        <h2
          id={`accesscast-title-${result.forecastId}`}
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Access Outlook
        </h2>
        <p className="text-slate-600">{result.tagline}</p>
      </header>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-800">Journey</dt>
          <dd className="text-slate-700">{result.journeyLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Time</dt>
          <dd className="text-slate-700">
            <time dateTime={result.intendedJourneyTime}>{result.intendedJourneyTime}</time>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-slate-800">State</dt>
          <dd>
            <p
              className="text-lg font-bold text-slate-900"
              aria-describedby={stateDescId}
            >
              {result.stateLabel}
              <span className="sr-only"> ({result.state})</span>
            </p>
            <p id={stateDescId} className="mt-1 text-slate-600">
              {ACCESSCAST_STATE_DEFINITIONS[result.state]}
            </p>
          </dd>
        </div>
      </dl>

      <section aria-labelledby={`accesscast-why-${result.forecastId}`}>
        <h3 id={`accesscast-why-${result.forecastId}`} className="text-lg font-bold">
          Why
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {result.why.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`accesscast-checks-${result.forecastId}`}>
        <h3 id={`accesscast-checks-${result.forecastId}`} className="text-lg font-bold">
          Suggested checks
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
          {result.suggestedChecks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-slate-600">
          Confirmation requested is not confirmation received, evidence verified, or a journey
          guarantee.
        </p>
      </section>

      <section aria-labelledby={`accesscast-fallback-${result.forecastId}`}>
        <h3 id={`accesscast-fallback-${result.forecastId}`} className="text-lg font-bold">
          Fallback
        </h3>
        <p className="mt-2 text-slate-700">{result.fallbackSummary}</p>
      </section>

      <p className="text-sm text-slate-600">
        Evidence confidence horizon:{" "}
        <time dateTime={result.confidenceHorizon}>{result.confidenceHorizon}</time>
      </p>

      <section aria-labelledby={`accesscast-steps-${result.forecastId}`}>
        <h3 id={`accesscast-steps-${result.forecastId}`} className="text-lg font-bold">
          Route steps (list alternative to map)
        </h3>
        <ol className="mt-3 space-y-3">
          {result.listAlternative.map((step, index) => (
            <li
              key={step.id}
              className="rounded border border-slate-200 p-3"
            >
              <p className="font-semibold text-slate-900">
                {index + 1}. {step.label}
              </p>
              <p className="text-sm text-slate-700">
                State: {step.stateLabel} — {step.summary}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {showTimeline ? (
        <section aria-labelledby={`accesscast-timeline-${result.forecastId}`}>
          <h3 id={`accesscast-timeline-${result.forecastId}`} className="text-lg font-bold">
            Forecast timeline
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Structured list is authoritative. Graphical timelines are optional.
          </p>
          <ol className="mt-3 space-y-2">
            {result.timeline.map((entry) => (
              <li key={`${entry.at}-${entry.label}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <time className="shrink-0 font-mono text-sm font-semibold text-slate-800" dateTime={entry.at}>
                  {entry.at}
                </time>
                <span className="text-slate-700">{entry.label}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {showEvidence ? (
        <section aria-labelledby={`accesscast-evidence-${result.forecastId}`}>
          <h3 id={`accesscast-evidence-${result.forecastId}`} className="text-lg font-bold">
            Evidence envelope
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Forecast ID: {result.envelope.forecastId}</li>
            <li>Horizon: {result.envelope.horizon}</li>
            <li>Matched requirements: {result.envelope.matchedRequirements.length}</li>
            <li>Failed requirements: {result.envelope.failedRequirements.length}</li>
            <li>Unresolved requirements: {result.envelope.unresolvedRequirements.length}</li>
            <li>Evidence items: {result.envelope.sourceEvidence.length}</li>
            <li>
              Expiry: <time dateTime={result.envelope.expiry}>{result.envelope.expiry}</time>
            </li>
          </ul>
        </section>
      ) : null}

      <footer>
        <h3 className="text-sm font-bold text-slate-800">Limitations</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {result.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
