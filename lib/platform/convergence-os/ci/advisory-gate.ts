import {
  isConvergenceCiGateEnabled,
  isConvergenceEnforcementActive,
  isConvergenceOsEnabled,
} from "@/lib/config/convergence-os";
import { analyseSchemaCollisions } from "@/lib/platform/convergence-os/schema/collision-engine";
import type { CollisionFinding } from "@/lib/platform/convergence-os/types";

export type AdvisoryCiResult = {
  mode: "disabled" | "advisory" | "enforced";
  exitCode: 0 | 1;
  warnings: string[];
  blockers: string[];
  findings: CollisionFinding[];
};

/**
 * Advisory CI gate (Wave 7).
 * Default: warnings only, exit 0.
 * Enforcement (Wave 8): only when mode=enforced AND CI gate enabled —
 * still limited to critical collision categories. Never auto-merges.
 */
export function evaluateAdvisoryCiFindings(
  findings: CollisionFinding[] = analyseSchemaCollisions()
): AdvisoryCiResult {
  if (!isConvergenceOsEnabled() || !isConvergenceCiGateEnabled()) {
    return {
      mode: "disabled",
      exitCode: 0,
      warnings: [],
      blockers: [],
      findings: [],
    };
  }

  const criticalCategories = new Set([
    "duplicate_canonical_writer",
    "migration_timestamp_collision",
    "stale_base_indoor_deletion",
  ]);

  const warnings = findings
    .filter((f) => f.severity === "warning" || f.severity === "high")
    .map((f) => `[${f.severity}] ${f.title}`);

  const critical = findings.filter(
    (f) => f.severity === "critical" && criticalCategories.has(f.category)
  );
  const blockers = critical.map((f) => `[critical] ${f.title}`);

  const enforced = isConvergenceEnforcementActive();
  // Wave 7: always advisory (exit 0) unless enforced mode explicitly on.
  // Even then, this function only reports — CI workflow decides fail.
  return {
    mode: enforced ? "enforced" : "advisory",
    exitCode: enforced && blockers.length > 0 ? 1 : 0,
    warnings: [...warnings, ...(!enforced ? blockers.map((b) => `ADVISORY ${b}`) : [])],
    blockers: enforced ? blockers : [],
    findings,
  };
}
