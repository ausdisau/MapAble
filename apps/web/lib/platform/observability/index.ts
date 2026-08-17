export {
  DEFAULT_REDACTION_POLICY,
  aggregateHealthStatus,
  redactSensitiveContent,
} from "@/lib/platform/observability/contracts";
export type {
  HealthCheckResult,
  HealthComponentStatus,
  MetricSample,
  ObservabilityRedactionPolicy,
  PlatformHealthSummary,
} from "@/lib/platform/observability/contracts";
export {
  getRecentHealthChecks,
  runNationalHealthChecks,
} from "@/lib/platform/observability/health-service";
