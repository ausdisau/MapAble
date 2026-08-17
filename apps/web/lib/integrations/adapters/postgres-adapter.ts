import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { prisma } from "@/lib/prisma";

export const postgresAdapter: IntegrationAdapter = {
  key: "postgres",
  type: "database",
  displayName: "PostgreSQL (Prisma)",

  isEnabled() {
    return isIntegrationEnvEnabled("postgres");
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    const start = Date.now();
    if (!this.isEnabled()) {
      return { status: "unhealthy", message: "DATABASE_URL not configured" };
    }
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "healthy",
        latencyMs: Date.now() - start,
        message: "Database reachable",
      };
    } catch (err) {
      return {
        status: "unhealthy",
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Database unreachable",
      };
    }
  },
};
