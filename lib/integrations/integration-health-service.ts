import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";
import { getIntegrationConnection } from "@/lib/integrations/integration-connection-service";
import { getIntegrationAdapter } from "@/lib/integrations/integration-registry";
import type { IntegrationAdapter } from "@/lib/integrations/integration-types";
import { prisma } from "@/lib/prisma";

export async function runIntegrationHealthCheck(
  integrationKey: string,
  actorUserId?: string | null
) {
  const adapter = getIntegrationAdapter(integrationKey);
  const connection = await getIntegrationConnection(integrationKey);
  if (!connection) {
    throw new Error(`Unknown integration: ${integrationKey}`);
  }

  let result: Awaited<ReturnType<IntegrationAdapter["healthCheck"]>>;
  try {
    result = await adapter.healthCheck();
  } catch (err) {
    result = {
      status: "unhealthy",
      message: err instanceof Error ? err.message : "Health check failed",
    };
  }

  const dbStatus =
    result.status === "healthy"
      ? "enabled"
      : result.status === "degraded"
        ? "degraded"
        : "error";

  await prisma.integrationHealthCheck.create({
    data: {
      connectionId: connection.id,
      status: result.status,
      latencyMs: result.latencyMs,
      message: result.message,
    },
  });

  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: {
      status: adapter.isEnabled() ? dbStatus : "disabled",
      lastHealthCheckAt: new Date(),
      lastError: result.status === "healthy" ? null : result.message ?? null,
    },
  });

  await auditIntegrationAction({
    integrationKey,
    action: "health_check",
    actorUserId,
    metadata: { status: result.status, message: result.message },
    severity: result.status === "healthy" ? "info" : "warning",
  });

  return result;
}

export async function runAllIntegrationHealthChecks(actorUserId?: string | null) {
  const { listRegisteredIntegrationKeys } = await import(
    "@/lib/integrations/integration-registry"
  );
  const keys = listRegisteredIntegrationKeys();
  const results: Record<string, Awaited<ReturnType<typeof runIntegrationHealthCheck>>> =
    {};
  for (const key of keys) {
    results[key] = await runIntegrationHealthCheck(key, actorUserId);
  }
  return results;
}
