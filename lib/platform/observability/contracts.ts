/**
 * CareOS Phase 15 — Platform observability contracts.
 * All exported health data is redacted by default.
 */

export type HealthComponentStatus = "ok" | "degraded" | "critical" | "unknown";

export interface HealthCheckResult {
  component: string;
  region: string;
  status: HealthComponentStatus;
  message: string;
  latencyMs?: number;
  checkedAt: string;
}

export interface PlatformHealthSummary {
  overall: HealthComponentStatus;
  region: string;
  checkedAt: string;
  checks: HealthCheckResult[];
  redacted: true;
}

export interface MetricSample {
  name: string;
  value: number;
  unit: string;
  labels: Record<string, string>;
}

export interface ObservabilityRedactionPolicy {
  redactConnectionStrings: boolean;
  redactSecrets: boolean;
  redactPii: boolean;
  redactInternalHostnames: boolean;
}

export const DEFAULT_REDACTION_POLICY: ObservabilityRedactionPolicy = {
  redactConnectionStrings: true,
  redactSecrets: true,
  redactPii: true,
  redactInternalHostnames: true,
};

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*\S+/gi,
  /sk_(?:live|test)_[a-zA-Z0-9]+/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
];

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

export function redactSensitiveContent(
  text: string,
  policy: ObservabilityRedactionPolicy = DEFAULT_REDACTION_POLICY,
): string {
  let result = text;
  if (policy.redactConnectionStrings || policy.redactSecrets) {
    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, "[REDACTED]");
    }
  }
  if (policy.redactPii) {
    for (const pattern of PII_PATTERNS) {
      result = result.replace(pattern, "[REDACTED]");
    }
  }
  if (policy.redactInternalHostnames) {
    result = result.replace(
      /\b(?:internal|private|vpc)[-.a-z0-9]+\.(?:local|internal)\b/gi,
      "[REDACTED-HOST]",
    );
  }
  return result;
}

export function aggregateHealthStatus(
  checks: HealthCheckResult[],
): HealthComponentStatus {
  if (checks.some((c) => c.status === "critical")) return "critical";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  if (checks.every((c) => c.status === "ok")) return "ok";
  return "unknown";
}
