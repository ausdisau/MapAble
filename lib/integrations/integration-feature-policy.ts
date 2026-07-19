import type { IntegrationKey } from "@/lib/integrations/integration-types";

/** Safety-critical integrations must fail closed when disabled or unhealthy. */
export const FAIL_CLOSED_INTEGRATION_KEYS: IntegrationKey[] = [
  "postgres",
  "temporal",
];

/** Events that must never be sent via n8n or similar low-risk automation. */
export const BLOCKED_AUTOMATION_EVENTS = [
  "incident_reportability_decision",
  "invoice_approval",
  "payment_change",
  "worker_high_risk_assignment",
  "participant_consent_override",
  "safeguarding_case_closure",
  "role_permission_change",
] as const;

export type AutomationEventKey = string;

export const ALLOWED_AUTOMATION_EVENTS = [
  "support_ticket_created",
  "policy_review_due",
  "provider_profile_incomplete",
  "training_expiry_reminder",
  "document_upload_received",
  "newsletter_signup",
  "low_risk_admin_reminder",
] as const;

export function isAutomationEventAllowed(eventKey: AutomationEventKey): boolean {
  if (
    BLOCKED_AUTOMATION_EVENTS.includes(
      eventKey as (typeof BLOCKED_AUTOMATION_EVENTS)[number]
    )
  ) {
    return false;
  }
  return ALLOWED_AUTOMATION_EVENTS.includes(
    eventKey as (typeof ALLOWED_AUTOMATION_EVENTS)[number]
  );
}

export function mustFailClosed(integrationKey: string): boolean {
  return FAIL_CLOSED_INTEGRATION_KEYS.includes(
    integrationKey as IntegrationKey
  );
}

export function isIntegrationEnvEnabled(key: string): boolean {
  const envMap: Record<string, string | undefined> = {
    postgres: process.env.DATABASE_URL,
    stripe: process.env.STRIPE_ENABLED,
    xero: process.env.XERO_ENABLED,
    ndia: process.env.NDIA_READINESS_ENABLED,
    keycloak: process.env.KEYCLOAK_ENABLED,
    maplibre: process.env.MAP_INTEGRATION_ENABLED,
    openstreetmap: process.env.OPENSTREETMAP_ENABLED,
    opensearch: process.env.OPENSEARCH_ENABLED,
    supabase: process.env.SUPABASE_ENABLED,
    supabase_realtime: process.env.SUPABASE_REALTIME_ENABLED,
    socketio: process.env.SOCKETIO_ENABLED,
    temporal: process.env.TEMPORAL_ENABLED,
    n8n: process.env.N8N_ENABLED,
    directus: process.env.DIRECTUS_ENABLED,
    metabase: process.env.METABASE_ENABLED,
    medplum: process.env.FHIR_PROVIDER,
    hapi_fhir: process.env.FHIR_PROVIDER,
    jitsi: process.env.TELEHEALTH_VIDEO_PROVIDER,
    livekit: process.env.TELEHEALTH_VIDEO_PROVIDER,
    calcom: process.env.SCHEDULING_PROVIDER,
    erpnext: process.env.ERPNEXT_ENABLED,
  };

  const val = envMap[key];
  if (key === "postgres") return Boolean(val);
  if (key === "medplum") return val === "medplum";
  if (key === "hapi_fhir") return val === "hapi";
  if (key === "jitsi") return val === "jitsi";
  if (key === "livekit") return val === "livekit";
  if (key === "calcom") return val === "calcom";
  // Wave 0: map integrations fail closed (enable with === "true" for pilot).
  return val === "true";
}
