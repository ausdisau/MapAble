export type IntegrationType =
  | "identity"
  | "database"
  | "realtime"
  | "maps"
  | "search"
  | "workflow"
  | "automation"
  | "cms"
  | "analytics"
  | "clinical_fhir"
  | "telehealth"
  | "scheduling"
  | "finance";

export type IntegrationConnectionStatus =
  | "disabled"
  | "enabled"
  | "degraded"
  | "error";

export type IntegrationHealthResult = {
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  message?: string;
};

export interface IntegrationAdapter {
  readonly key: string;
  readonly type: IntegrationType;
  readonly displayName: string;
  isEnabled(): boolean;
  healthCheck(): Promise<IntegrationHealthResult>;
}

export type IntegrationPublicConfig = {
  key: string;
  type: IntegrationType;
  displayName: string;
  status: IntegrationConnectionStatus;
  environment: string;
  enabled: boolean;
  lastHealthCheckAt: string | null;
  lastError: string | null;
  configured: boolean;
};

export const INITIAL_INTEGRATION_KEYS = [
  "postgres",
  "stripe",
  "xero",
  "ndia",
  "keycloak",
  "maplibre",
  "openstreetmap",
  "opensearch",
  "supabase",
  "supabase_realtime",
  "socketio",
  "temporal",
  "n8n",
  "directus",
  "metabase",
  "medplum",
  "hapi_fhir",
  "jitsi",
  "livekit",
  "calcom",
  "erpnext",
] as const;

export type IntegrationKey = (typeof INITIAL_INTEGRATION_KEYS)[number];
