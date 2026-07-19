/**
 * Fail-closed production environment gate for real Vercel production deploys.
 * Local/CI/preview builds remain usable unless MAPABLE_ENFORCE_PRODUCTION_ENV=true.
 */
// Relative import so next.config.ts can load this without path aliases.
import {
  validateProductionDatabaseUrls,
  validateProductionNextAuthSecret,
  validateProductionPublicUrls,
  type CanonicalUrlIssue,
} from "../config/canonical-url";

export type ProductionEnvIssue = CanonicalUrlIssue;

export function shouldEnforceDeployedProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.MAPABLE_ENFORCE_PRODUCTION_ENV === "true") return true;
  return env.VERCEL === "1" && env.VERCEL_ENV === "production";
}

export function collectDeployedProductionEnvIssues(
  env: NodeJS.ProcessEnv = process.env,
): ProductionEnvIssue[] {
  if (!shouldEnforceDeployedProductionEnv(env)) return [];

  // Evaluate as production even if NODE_ENV is temporarily unset during config load.
  const prodEnv: NodeJS.ProcessEnv = {
    ...env,
    NODE_ENV: "production",
  };

  return [
    ...validateProductionDatabaseUrls(prodEnv),
    ...validateProductionPublicUrls(prodEnv),
    ...validateProductionNextAuthSecret(prodEnv),
  ];
}

/** Format issues without printing secret values. */
export function formatProductionEnvIssues(
  issues: ProductionEnvIssue[],
): string {
  return issues.map((i) => `${i.variable}: ${i.message}`).join("\n");
}

/**
 * Throws when production deployment env is invalid.
 * Never includes secret values in the error message.
 */
export function assertDeployedProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const issues = collectDeployedProductionEnvIssues(env);
  if (issues.length === 0) return;

  throw new Error(
    [
      "MapAble production environment validation failed (fail-closed).",
      "Fix Vercel Production env vars. Secret values are never printed.",
      formatProductionEnvIssues(issues),
    ].join("\n"),
  );
}
