import { notFound } from "next/navigation";

import { IntegrationConfigPanel } from "@/components/integrations/IntegrationConfigPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { listIntegrationEvents } from "@/lib/integrations/integration-event-service";
import { getIntegrationPublic } from "@/lib/integrations/integration-registry";

export default async function AdminIntegrationDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireAdmin();
  const { key } = await params;
  const integration = await getIntegrationPublic(key);
  if (!integration) notFound();

  const events = await listIntegrationEvents(key, 20);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{integration.displayName}</h1>
      <IntegrationConfigPanel integration={integration} />
      <section>
        <h2 className="text-lg font-semibold">Events</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="rounded border px-3 py-2">
              <span className="font-medium">{e.eventType}</span>
              <span className="text-muted-foreground">
                {" "}
                · {e.createdAt.toLocaleString()}
              </span>
              {e.message ? <p>{e.message}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
