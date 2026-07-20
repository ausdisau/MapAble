/**
 * Next.js instrumentation — runs once when the Node server process starts.
 * Enforces production env validation on Vercel production runtimes.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { assertDeployedProductionEnv } =
    await import("@/lib/env/assert-deployed-production-env");
  assertDeployedProductionEnv(process.env);
}
