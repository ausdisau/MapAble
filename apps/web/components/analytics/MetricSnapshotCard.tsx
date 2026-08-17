import { analyticsResearchConfig } from "@/lib/config/analytics-research";

type MetricCardProps = {
  name: string;
  value: number | null;
  unit?: string | null;
  suppressed?: boolean;
  suppressionReason?: string | null;
  deidentificationLevel?: string;
};

export function MetricSnapshotCard({
  name,
  value,
  unit,
  suppressed,
  suppressionReason,
  deidentificationLevel,
}: MetricCardProps) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="font-medium text-sm text-muted-foreground">{name}</h3>
      <p className="mt-2 font-heading text-3xl font-bold">
        {suppressed ? "—" : (value ?? "—")}
        {unit && !suppressed ? (
          <span className="ml-1 text-base font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {suppressed ? (
        <p className="mt-2 text-xs text-amber-700" role="status">
          Suppressed: {suppressionReason ?? "Small cell threshold"}
        </p>
      ) : null}
      {deidentificationLevel ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {deidentificationLevel} — not anonymous
        </p>
      ) : null}
    </article>
  );
}

export function AnalyticsCloudStatus() {
  const enabled = analyticsResearchConfig.analyticsCloudEnabled;
  return (
    <p className="text-sm" role="status">
      Analytics cloud:{" "}
      <span className={enabled ? "text-green-700" : "text-muted-foreground"}>
        {enabled ? "enabled" : "disabled — set MAPABLE_ANALYTICS_CLOUD_ENABLED=true"}
      </span>
    </p>
  );
}
