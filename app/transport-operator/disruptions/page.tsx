import { DisruptionQueuePanel } from "@/components/transport/DisruptionQueuePanel";
import { requireAuth } from "@/lib/auth/guards";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { listOpenDisruptions } from "@/lib/transport/continuity/recovery-service";
import { fetchTransitDisruptions } from "@/lib/transport/public-transit/disruptions-service";

export const metadata = { title: "Disruptions | Transport command" };

export default async function TransportOperatorDisruptionsPage() {
  await requireAuth();

  const [internal, transit] = await Promise.all([
    transportCommandConfig.commandCentreEnabled
      ? listOpenDisruptions()
      : Promise.resolve([]),
    transportCommandConfig.publicTransitAdaptersEnabled
      ? fetchTransitDisruptions()
      : Promise.resolve({ enabled: false, disruptions: [], nonLiveFallback: true }),
  ]);

  const transitItems = transit.disruptions.map((d) => ({
    id: d.id,
    kind: d.kind,
    status: "open",
    title: d.title,
    description: d.description,
    source: d.source.label,
    sourceFreshnessAt: d.source.fetchedAt,
    createdAt: d.source.fetchedAt,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Disruption queue</h1>
        <p className="text-muted-foreground">
          Internal transport disruptions and public transit alerts with source freshness.
        </p>
      </header>

      <DisruptionQueuePanel disruptions={internal} />

      {transit.enabled ? (
        <section>
          <h2 className="font-semibold">Public transit alerts</h2>
          <p className="text-sm text-muted-foreground">
            Non-live accessible alternatives remain available when live feeds are stale.
          </p>
          <div className="mt-3">
            <DisruptionQueuePanel disruptions={transitItems} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
