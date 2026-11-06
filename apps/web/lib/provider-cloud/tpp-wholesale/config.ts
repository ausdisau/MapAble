/**
 * A read-only TPP query requires explicit enablement and operator confirmation
 * that JWT authentication and subsequent requests use the same fixed egress IP.
 * Never enable live purchases through this feature flag.
 */
export function isTppWholesaleReadOnlyEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const permittedRuntime =
    env.VERCEL_ENV === "preview" ||
    (!env.VERCEL_ENV && env.NODE_ENV !== "production");
  return (
    env.MAPABLE_PROVIDER_CLOUD_ENABLED === "true" &&
    env.MAPABLE_TPP_WHOLESALE_READONLY_ENABLED === "true" &&
    env.MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED === "true" &&
    permittedRuntime &&
    env.VERCEL_ENV !== "production"
  );
}
