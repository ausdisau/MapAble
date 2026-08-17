import { getLatestStatusPage, runPlatformHealthChecks } from "@/lib/platform/status/status-service";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  let health;
  try {
    health = await runPlatformHealthChecks();
  } catch {
    health = {
      status: "degraded",
      checkedAt: new Date().toISOString(),
      checks: [],
      nationalInfrastructure: false,
    };
  }
  const latest = await getLatestStatusPage().catch(() => ({
    components: [],
    partnerMarketplace: false,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">MapAble status</h1>
      <p className="text-sm text-muted-foreground">
        Operational health — not a legal SLA commitment.
      </p>
      <section className="rounded-lg border p-4">
        <p className="text-lg font-medium capitalize">Overall: {health.status}</p>
        <p className="text-xs text-muted-foreground">
          Checked {new Date(health.checkedAt).toLocaleString("en-AU")}
        </p>
      </section>
      <ul className="space-y-2">
        {health.checks.map((c) => (
          <li key={c.component} className="rounded border p-3 text-sm">
            <strong>{c.component}</strong> — {c.status}
            <p className="text-muted-foreground">{c.message}</p>
          </li>
        ))}
      </ul>
      {latest.components.length > 0 ? (
        <section>
          <h2 className="font-medium">Recent checks</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {latest.components.map((c) => (
              <li key={c.id}>
                {c.component}: {c.status}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
