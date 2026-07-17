import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
  IntegrationType,
} from "@/lib/integrations/integration-types";

export function createStubAdapter(
  key: string,
  type: IntegrationType,
  displayName: string
): IntegrationAdapter {
  return {
    key,
    type,
    displayName,
    isEnabled() {
      return isIntegrationEnvEnabled(key);
    },
    async healthCheck(): Promise<IntegrationHealthResult> {
      if (!this.isEnabled()) {
        return {
          status: "degraded",
          message: `${displayName} not enabled via environment`,
        };
      }
      return {
        status: "healthy",
        message: `${displayName} adapter registered (stub health)`,
      };
    },
  };
}
