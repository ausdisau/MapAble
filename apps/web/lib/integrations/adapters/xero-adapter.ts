import { isXeroConfigured } from "@/lib/config/phase2";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";

export const xeroAdapter: IntegrationAdapter = {
  key: "xero",
  type: "finance",
  displayName: "Xero",

  isEnabled() {
    return isIntegrationEnvEnabled("xero") && isXeroConfigured();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "Xero not configured",
      };
    }
    return { status: "healthy", message: "Xero enabled (OAuth may be placeholder)" };
  },
};
