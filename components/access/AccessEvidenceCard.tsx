import { AccessDataSourceMarker, type AccessDataSourceKind } from "@/components/access/AccessDataSourceMarker";
import { cn } from "@/app/lib/utils";

export type AccessEvidenceMeasurement = {
  label: string;
  value: string;
  note?: string;
};

export type AccessEvidenceCardProps = {
  title?: string;
  measurements: AccessEvidenceMeasurement[];
  confidence: "high" | "medium" | "low" | "unknown" | string;
  lastChecked: string;
  sourceKind: AccessDataSourceKind;
  className?: string;
};

function confidencePercent(confidence: string): number | null {
  switch (confidence) {
    case "high":
      return 90;
    case "medium":
      return 65;
    case "low":
      return 35;
    case "unknown":
      return null;
    default:
      return null;
  }
}

/**
 * Reusable evidence panel for doorway widths, gradients, confidence, and freshness.
 */
export function AccessEvidenceCard({
  title = "Access evidence",
  measurements,
  confidence,
  lastChecked,
  sourceKind,
  className,
}: AccessEvidenceCardProps) {
  const score = confidencePercent(confidence);

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5",
        className,
      )}
      aria-labelledby="access-evidence-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="access-evidence-heading"
            className="text-xl font-black tracking-[-0.03em] text-[#0C1833]"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Measurements and confidence for planning — confirm critical details
            on arrival.
          </p>
        </div>
        <AccessDataSourceMarker kind={sourceKind} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Confidence
          </dt>
          <dd className="mt-1 text-sm font-semibold capitalize text-[#0C1833]">
            {confidence}
            {score != null ? (
              <span className="ml-2 text-slate-500">({score}% indicative)</span>
            ) : null}
          </dd>
          {score != null ? (
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
              aria-label={`Confidence score ${score} percent`}
            >
              <div
                className="h-full rounded-full bg-[#005B7F]"
                style={{ width: `${score}%` }}
              />
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Last checked
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[#0C1833]">
            <time dateTime={lastChecked}>{lastChecked}</time>
          </dd>
        </div>
      </dl>

      {measurements.length > 0 ? (
        <ul className="mt-5 space-y-2" aria-label="Access measurements">
          {measurements.map((item) => (
            <li
              key={`${item.label}-${item.value}`}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-sm font-semibold text-[#0C1833]">
                {item.label}
              </span>
              <span className="text-sm font-black text-[#005B7F]">
                {item.value}
              </span>
              {item.note ? (
                <span className="w-full text-xs text-slate-500">{item.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-slate-600" role="status">
          No structured measurements published for this place yet.
        </p>
      )}
    </section>
  );
}
