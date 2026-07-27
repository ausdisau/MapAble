/**
 * CareOS Phase 15 — Cost observability and optimisation hints.
 */

export interface CostEstimate {
  service: string;
  monthlyAud: number;
  unit: string;
  notes?: string;
}

export interface CostOptimisationHint {
  id: string;
  title: string;
  description: string;
  estimatedSavingPercent?: number;
  environment: "development" | "staging" | "production" | "all";
}

export const BASELINE_COST_ESTIMATES: CostEstimate[] = [
  {
    service: "application_hosting",
    monthlyAud: 450,
    unit: "AUD/month",
    notes: "2× app instances, staging + production baseline",
  },
  {
    service: "postgresql",
    monthlyAud: 280,
    unit: "AUD/month",
    notes: "Managed PostgreSQL with PITR — primary region",
  },
  {
    service: "redis",
    monthlyAud: 95,
    unit: "AUD/month",
    notes: "Cache and session store",
  },
  {
    service: "object_storage",
    monthlyAud: 40,
    unit: "AUD/month",
    notes: "Documents with versioning enabled",
  },
  {
    service: "cdn_waf",
    monthlyAud: 120,
    unit: "AUD/month",
    notes: "CDN egress + WAF rules",
  },
  {
    service: "monitoring",
    monthlyAud: 65,
    unit: "AUD/month",
    notes: "Metrics, logs, alerting",
  },
];

export const COST_OPTIMISATION_HINTS: CostOptimisationHint[] = [
  {
    id: "dev_auto_shutdown",
    title: "Schedule dev environment shutdown",
    description: "Stop non-production compute outside business hours.",
    estimatedSavingPercent: 40,
    environment: "development",
  },
  {
    id: "redis_ttl_review",
    title: "Review Redis TTL policies",
    description: "Ensure cache keys expire; avoid unbounded growth.",
    estimatedSavingPercent: 10,
    environment: "all",
  },
  {
    id: "cdn_cache_headers",
    title: "Optimise CDN cache headers",
    description: "Increase static asset cache TTL to reduce origin egress.",
    estimatedSavingPercent: 15,
    environment: "production",
  },
  {
    id: "dr_cold_standby",
    title: "DR cold standby for non-prod",
    description: "Keep DR region schemas synced but compute scaled to zero until drill.",
    estimatedSavingPercent: 50,
    environment: "disaster-recovery" as CostOptimisationHint["environment"],
  },
];

export function estimateMonthlyTotal(estimates: CostEstimate[] = BASELINE_COST_ESTIMATES): number {
  return estimates.reduce((sum, e) => sum + e.monthlyAud, 0);
}

export function getHintsForEnvironment(
  environment: CostOptimisationHint["environment"],
): CostOptimisationHint[] {
  return COST_OPTIMISATION_HINTS.filter(
    (h) => h.environment === environment || h.environment === "all",
  );
}
