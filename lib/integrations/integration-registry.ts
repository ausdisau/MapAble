import { maplibreAdapter } from "@/lib/integrations/adapters/maplibre-adapter";
import { ndiaAdapter } from "@/lib/integrations/adapters/ndia-adapter";
import { openSearchAdapter } from "@/lib/integrations/adapters/opensearch-adapter";
import { openStreetMapAdapter } from "@/lib/integrations/adapters/openstreetmap-adapter";
import { postgresAdapter } from "@/lib/integrations/adapters/postgres-adapter";
import { stripeAdapter } from "@/lib/integrations/adapters/stripe-adapter";
import { createStubAdapter } from "@/lib/integrations/adapters/stub-adapter";
import { xeroAdapter } from "@/lib/integrations/adapters/xero-adapter";
import {
  getIntegrationConnection,
  getPublicConnectionSummary,
  listIntegrationConnections,
} from "@/lib/integrations/integration-connection-service";
import {
  IntegrationDisabledError,
  IntegrationHealthError,
} from "@/lib/integrations/integration-error";
import {
  mustFailClosed,
  isIntegrationEnvEnabled,
} from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationKey,
  IntegrationPublicConfig,
} from "@/lib/integrations/integration-types";

const adapters = new Map<string, IntegrationAdapter>();

function register(adapter: IntegrationAdapter) {
  adapters.set(adapter.key, adapter);
}

register(postgresAdapter);
register(stripeAdapter);
register(xeroAdapter);
register(ndiaAdapter);
register(maplibreAdapter);
register(openStreetMapAdapter);
register(openSearchAdapter);

const stubKeys: Array<[string, IntegrationAdapter["type"], string]> = [
  ["keycloak", "identity", "Keycloak"],
  ["supabase", "database", "Supabase"],
  ["supabase_realtime", "realtime", "Supabase Realtime"],
  ["socketio", "realtime", "Socket.IO"],
  ["temporal", "workflow", "Temporal"],
  ["n8n", "automation", "n8n"],
  ["directus", "cms", "Directus"],
  ["metabase", "analytics", "Metabase"],
  ["medplum", "clinical_fhir", "Medplum"],
  ["hapi_fhir", "clinical_fhir", "HAPI FHIR"],
  ["jitsi", "telehealth", "Jitsi"],
  ["livekit", "telehealth", "LiveKit"],
  ["calcom", "scheduling", "Cal.com"],
  ["erpnext", "finance", "ERPNext"],
];

for (const [key, type, name] of stubKeys) {
  register(createStubAdapter(key, type, name));
}

export function listRegisteredIntegrationKeys(): string[] {
  return Array.from(adapters.keys());
}

export function getIntegrationAdapter(key: string): IntegrationAdapter {
  const adapter = adapters.get(key);
  if (!adapter) {
    throw new Error(`No adapter registered for integration: ${key}`);
  }
  return adapter;
}

export function requireIntegrationEnabled(key: string): IntegrationAdapter {
  const adapter = getIntegrationAdapter(key);
  if (!adapter.isEnabled()) {
    if (mustFailClosed(key)) {
      throw new IntegrationDisabledError(key);
    }
    throw new IntegrationDisabledError(key);
  }
  return adapter;
}

export async function assertIntegrationHealthy(key: string): Promise<void> {
  const adapter = requireIntegrationEnabled(key);
  const health = await adapter.healthCheck();
  if (health.status === "unhealthy" && mustFailClosed(key)) {
    throw new IntegrationHealthError(key, health.message ?? "Unhealthy");
  }
}

export async function listIntegrationsPublic(): Promise<
  IntegrationPublicConfig[]
> {
  const rows = await listIntegrationConnections();
  return rows.map((row) => {
    const adapter = adapters.get(row.integrationKey);
    const summary = getPublicConnectionSummary(row);
    return {
      ...summary,
      type: row.integrationType,
      enabled:
        summary.enabled &&
        (adapter?.isEnabled() ?? isIntegrationEnvEnabled(row.integrationKey)),
    };
  });
}

export async function getIntegrationPublic(
  key: string
): Promise<IntegrationPublicConfig | null> {
  const row = await getIntegrationConnection(key);
  if (!row) return null;
  const adapter = getIntegrationAdapter(key);
  return {
    ...getPublicConnectionSummary(row),
    type: row.integrationType,
    enabled: row.status === "enabled" && adapter.isEnabled(),
  };
}

export function isIntegrationKey(key: string): key is IntegrationKey {
  return adapters.has(key);
}
