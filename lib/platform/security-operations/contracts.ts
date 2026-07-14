/**
 * CareOS Phase 15 — Security operations interfaces.
 * SIEM integration stubs and incident response hooks.
 */

export type SecurityEventSeverity = "info" | "warning" | "critical";

export interface SecurityEvent {
  id: string;
  type: string;
  severity: SecurityEventSeverity;
  source: string;
  message: string;
  occurredAt: string;
  metadata?: Record<string, string>;
}

export interface SiemExportBatch {
  events: SecurityEvent[];
  exportedAt: string;
  redacted: true;
}

export interface IncidentResponsePlaybook {
  id: string;
  title: string;
  triggerTypes: string[];
  steps: string[];
  escalationContacts: string[];
}

export const INCIDENT_PLAYBOOKS: IncidentResponsePlaybook[] = [
  {
    id: "credential_leak",
    title: "Suspected credential leak",
    triggerTypes: ["auth.anomaly", "secret_scan.alert"],
    steps: [
      "Rotate affected credentials in secrets manager",
      "Review ApiAccessLog for anomalous requests",
      "Notify security lead and document in audit trail",
      "Do not purge audit logs during investigation",
    ],
    escalationContacts: ["security@mapable.com.au"],
  },
  {
    id: "data_breach_suspected",
    title: "Suspected data breach",
    triggerTypes: ["access.anomaly", "export.volume_spike"],
    steps: [
      "Enable degraded mode for affected modules",
      "Preserve audit events and access logs",
      "Engage privacy officer per AUDIT_AND_PRIVACY.md",
      "Prepare regulator notification timeline if confirmed",
    ],
    escalationContacts: ["privacy@mapable.com.au", "security@mapable.com.au"],
  },
  {
    id: "waf_attack",
    title: "WAF attack mitigation",
    triggerTypes: ["waf.rate_limit", "waf.blocked_request_spike"],
    steps: [
      "Review WAF logs in monitoring dashboard",
      "Adjust rate limits if legitimate traffic affected",
      "Block offending IP ranges via WAF rules",
      "Monitor error rates post-mitigation",
    ],
    escalationContacts: ["ops@mapable.com.au"],
  },
];

export function getIncidentPlaybook(id: string): IncidentResponsePlaybook | undefined {
  return INCIDENT_PLAYBOOKS.find((p) => p.id === id);
}

export function classifySecurityEvent(input: {
  type: string;
  message: string;
}): SecurityEventSeverity {
  const criticalPatterns = [/breach/i, /unauthorized.*admin/i, /credential.*leak/i];
  const warningPatterns = [/rate.?limit/i, /failed.?login/i, /anomaly/i];

  if (criticalPatterns.some((p) => p.test(input.message) || p.test(input.type))) {
    return "critical";
  }
  if (warningPatterns.some((p) => p.test(input.message) || p.test(input.type))) {
    return "warning";
  }
  return "info";
}
