import Link from "next/link";

import { IntegrationAuditTimeline } from "@/components/integrations/IntegrationAuditTimeline";
import { IntegrationHealthDashboard } from "@/components/integrations/IntegrationHealthDashboard";
import { requireAdmin } from "@/lib/auth/guards";
import { listIntegrationEvents } from "@/lib/integrations/integration-event-service";
import { listIntegrationsPublic } from "@/lib/integrations/integration-registry";

export default async function AdminIntegrationsPage() {
  await requireAdmin();

  const integrations = await listIntegrationsPublic();
  const events = await listIntegrationEvents(undefined, 30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Platform integrations</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Open-source engines connected to MapAble. MapAble remains the source of
          truth for participants, consent, bookings, and safeguarding. Secrets are
          never displayed here.
        </p>
      </div>

      <IntegrationHealthDashboard
        initialIntegrations={integrations.map((i) => ({
          key: i.key,
          displayName: i.displayName,
          type: i.type,
          status: i.status,
          enabled: i.enabled,
          configured: i.configured,
          lastHealthCheckAt: i.lastHealthCheckAt,
          lastError: i.lastError,
        }))}
      />

      <section aria-labelledby="integration-links-heading">
        <h2 id="integration-links-heading" className="text-lg font-semibold">
          Detail pages
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {integrations.slice(0, 8).map((i) => (
            <li key={i.key}>
              <Link
                href={`/admin/integrations/${i.key}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {i.displayName}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="audit-timeline-heading">
        <h2 id="audit-timeline-heading" className="text-lg font-semibold">
          Recent integration events
        </h2>
        <div className="mt-4">
          <IntegrationAuditTimeline
            events={events.map((e) => ({
              id: e.id,
              integrationKey: e.connection.integrationKey,
              displayName: e.connection.displayName,
              eventType: e.eventType,
              severity: e.severity,
              message: e.message,
              createdAt: e.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
