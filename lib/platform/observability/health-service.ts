import { nationalPlatformConfig } from "@/lib/config/national-platform";
import { getCloudConfig } from "@/lib/platform/cloud-config";
import {
  aggregateHealthStatus,
  redactSensitiveContent,
  type HealthCheckResult,
  type PlatformHealthSummary,
} from "@/lib/platform/observability/contracts";
import { prisma } from "@/lib/prisma";

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  let status: HealthCheckResult["status"] = "unknown";
  let message = "Database check not run";

  try {
    await prisma.$queryRaw`SELECT 1`;
    status = "ok";
    message = "Database reachable";
  } catch (err) {
    status = "degraded";
    message = redactSensitiveContent(
      err instanceof Error ? err.message : "Database check failed",
    );
  }

  return {
    component: "database",
    region: nationalPlatformConfig.primaryRegion,
    status,
    message,
    latencyMs: Date.now() - start,
    checkedAt: new Date().toISOString(),
  };
}

function checkCloudProviders(): HealthCheckResult {
  try {
    const config = getCloudConfig();
    const degraded =
      config.MAPABLE_ENVIRONMENT === "production" &&
      (config.CLOUD_STORAGE_PROVIDER === "recording" ||
        config.CLOUD_QUEUE_PROVIDER === "recording");

    return {
      component: "cloud_providers",
      region: nationalPlatformConfig.primaryRegion,
      status: degraded ? "degraded" : "ok",
      message: degraded
        ? "Recording providers active in production — use managed providers"
        : `Environment: ${config.MAPABLE_ENVIRONMENT}`,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      component: "cloud_providers",
      region: nationalPlatformConfig.primaryRegion,
      status: "degraded",
      message: redactSensitiveContent(
        err instanceof Error ? err.message : "Cloud config invalid",
      ),
      checkedAt: new Date().toISOString(),
    };
  }
}

function checkFederation(): HealthCheckResult {
  return {
    component: "federation",
    region: nationalPlatformConfig.primaryRegion,
    status: nationalPlatformConfig.federationEnabled ? "ok" : "unknown",
    message: nationalPlatformConfig.federationEnabled
      ? "Federation enabled — participant authority blocked by policy"
      : "Federation disabled",
    checkedAt: new Date().toISOString(),
  };
}

export async function runNationalHealthChecks(): Promise<PlatformHealthSummary> {
  const checks: HealthCheckResult[] = [
    await checkDatabase(),
    checkCloudProviders(),
    checkFederation(),
    {
      component: "api",
      region: nationalPlatformConfig.primaryRegion,
      status: "ok",
      message: "Application responding",
      checkedAt: new Date().toISOString(),
    },
  ];

  if (nationalPlatformConfig.nationalPlatformEnabled) {
    for (const check of checks) {
      await prisma.platformHealthCheck.create({
        data: {
          component: check.component,
          region: check.region,
          status: check.status,
          message: check.message,
          latencyMs: check.latencyMs,
          redacted: true,
          checkedAt: new Date(check.checkedAt),
        },
      });
    }
  }

  return {
    overall: aggregateHealthStatus(checks),
    region: nationalPlatformConfig.primaryRegion,
    checkedAt: new Date().toISOString(),
    checks,
    redacted: true,
  };
}

export async function getRecentHealthChecks(limit = 30) {
  if (!nationalPlatformConfig.nationalPlatformEnabled) {
    return { disabled: true as const, checks: [] };
  }

  const rows = await prisma.platformHealthCheck.findMany({
    orderBy: { checkedAt: "desc" },
    take: limit,
    select: {
      id: true,
      component: true,
      region: true,
      status: true,
      message: true,
      latencyMs: true,
      checkedAt: true,
    },
  });

  const checks = rows.map((row) => ({
    ...row,
    message: row.message ? redactSensitiveContent(row.message) : null,
    checkedAt: row.checkedAt.toISOString(),
  }));

  return { disabled: false as const, checks };
}
