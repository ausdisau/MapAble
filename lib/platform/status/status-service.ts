import { phase5Config } from "@/lib/config/phase5";
import { phase7Config } from "@/lib/config/phase7";
import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function runPlatformHealthChecks() {
  const checks: { component: string; status: string; message: string }[] = [];

  checks.push({
    component: "api",
    status: "ok",
    message: "Application responding",
  });

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  checks.push({
    component: "database",
    status: dbOk ? "ok" : "degraded",
    message: dbOk ? "Database reachable" : "Database check failed",
  });

  checks.push({
    component: "matching",
    status: phase5Config.aiMatchingEnabled ? "ok" : "degraded",
    message: phase5Config.aiMatchingEnabled
      ? "AI matching enabled"
      : "AI matching disabled by flag",
  });

  checks.push({
    component: "payments",
    status:
      phase5Config.stripeEnabled || phase5Config.xeroEnabled ? "ok" : "degraded",
    message: "Stripe/Xero require explicit env configuration",
  });

  checks.push({
    component: "ndia",
    status: phase7Config.ndiaPilotEnabled ? "degraded" : "ok",
    message: phase7Config.ndiaPilotEnabled
      ? "NDIA pilot enabled — governance required"
      : "NDIA pilot off (readiness only)",
  });

  checks.push({
    component: "government_portal",
    status: phase7Config.governmentPartnerPortalEnabled ? "ok" : "degraded",
    message: phase7Config.governmentPartnerPortalEnabled
      ? "Government portal enabled"
      : "Government portal disabled",
  });

  for (const c of checks) {
    await prisma.platformStatusCheck.create({
      data: {
        component: c.component,
        status: c.status,
        message: c.message,
      },
    });
  }

  const overall = checks.some((c) => c.status === "degraded")
    ? "degraded"
    : "ok";

  return {
    status: overall,
    checkedAt: new Date().toISOString(),
    nationalInfrastructure: phase8Config.nationalInsightsEnabled,
    checks,
  };
}

export async function getLatestStatusPage() {
  const recent = await prisma.platformStatusCheck.findMany({
    orderBy: { checkedAt: "desc" },
    take: 30,
  });
  const byComponent = new Map<string, (typeof recent)[0]>();
  for (const row of recent) {
    if (!byComponent.has(row.component)) byComponent.set(row.component, row);
  }
  return {
    components: [...byComponent.values()],
    partnerMarketplace: phase8Config.partnerMarketplaceEnabled,
  };
}
