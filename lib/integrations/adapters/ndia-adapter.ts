import { phase5Config } from "@/lib/config/phase5";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";

export const ndiaAdapter: IntegrationAdapter = {
  key: "ndia",
  type: "finance",
  displayName: "NDIA Provider Claiming",

  isEnabled() {
    return isIntegrationEnvEnabled("ndia") && phase5Config.ndiaReadinessEnabled;
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return { status: "degraded", message: "NDIA readiness module disabled" };
    }
    return {
      status: "healthy",
      message: `NDIA adapter active (live submit: ${phase5Config.ndiaRealSubmissionEnabled})`,
    };
  },
};
