import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type { IntegrationConnectionStatus, IntegrationType } from "@/lib/integrations/integration-types";
import { INITIAL_INTEGRATION_KEYS } from "@/lib/integrations/integration-types";
import { prisma } from "@/lib/prisma";

const SEED_DEFINITIONS: Array<{
  key: string;
  type: IntegrationType;
  displayName: string;
}> = [
  { key: "postgres", type: "database", displayName: "PostgreSQL (Prisma)" },
  { key: "stripe", type: "finance", displayName: "Stripe" },
  { key: "xero", type: "finance", displayName: "Xero" },
  { key: "ndia", type: "finance", displayName: "NDIA Provider Claiming" },
  { key: "keycloak", type: "identity", displayName: "Keycloak" },
  { key: "maplibre", type: "maps", displayName: "MapLibre" },
  { key: "openstreetmap", type: "maps", displayName: "OpenStreetMap" },
  { key: "opensearch", type: "search", displayName: "OpenSearch" },
  { key: "supabase", type: "database", displayName: "Supabase (optional)" },
  { key: "supabase_realtime", type: "realtime", displayName: "Supabase Realtime" },
  { key: "socketio", type: "realtime", displayName: "Socket.IO Gateway" },
  { key: "temporal", type: "workflow", displayName: "Temporal" },
  { key: "n8n", type: "automation", displayName: "n8n" },
  { key: "directus", type: "cms", displayName: "Directus" },
  { key: "metabase", type: "analytics", displayName: "Metabase" },
  { key: "medplum", type: "clinical_fhir", displayName: "Medplum FHIR" },
  { key: "hapi_fhir", type: "clinical_fhir", displayName: "HAPI FHIR" },
  { key: "jitsi", type: "telehealth", displayName: "Jitsi" },
  { key: "livekit", type: "telehealth", displayName: "LiveKit" },
  { key: "calcom", type: "scheduling", displayName: "Cal.com-style scheduling" },
  { key: "erpnext", type: "finance", displayName: "ERPNext" },
];

export async function ensureIntegrationConnectionsSeeded(): Promise<void> {
  for (const def of SEED_DEFINITIONS) {
    const envOn = isIntegrationEnvEnabled(def.key);
    await prisma.integrationConnection.upsert({
      where: { integrationKey: def.key },
      create: {
        integrationKey: def.key,
        integrationType: def.type,
        displayName: def.displayName,
        status: envOn ? "enabled" : "disabled",
        environment: process.env.NODE_ENV ?? "development",
      },
      update: {
        displayName: def.displayName,
        integrationType: def.type,
      },
    });
  }
}

export async function getIntegrationConnection(key: string) {
  await ensureIntegrationConnectionsSeeded();
  return prisma.integrationConnection.findUnique({
    where: { integrationKey: key },
    include: { featureFlags: true },
  });
}

export async function listIntegrationConnections() {
  await ensureIntegrationConnectionsSeeded();
  return prisma.integrationConnection.findMany({
    orderBy: { displayName: "asc" },
  });
}

export async function updateIntegrationSettings(
  key: string,
  input: {
    status?: IntegrationConnectionStatus;
    environment?: string;
    connectedById?: string;
  }
) {
  return prisma.integrationConnection.update({
    where: { integrationKey: key },
    data: {
      status: input.status,
      environment: input.environment,
      connectedById: input.connectedById,
      connectedAt: input.status === "enabled" ? new Date() : undefined,
    },
  });
}

export function getPublicConnectionSummary(
  row: Awaited<ReturnType<typeof listIntegrationConnections>>[number]
) {
  return {
    key: row.integrationKey,
    type: row.integrationType,
    displayName: row.displayName,
    status: row.status,
    environment: row.environment,
    enabled: row.status === "enabled" || row.status === "degraded",
    lastHealthCheckAt: row.lastHealthCheckAt?.toISOString() ?? null,
    lastError: row.lastError,
    configured: isIntegrationEnvEnabled(row.integrationKey),
  };
}

export { INITIAL_INTEGRATION_KEYS };
