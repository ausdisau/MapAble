import { phase5Config } from "@/lib/config/phase5";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { getNdiaGatewayReadiness } from "@/lib/ndis/api-gateway/ndia-gateway-contract";

export const ndiaAdapter: IntegrationAdapter = {
  key: "ndia",
  type: "finance",
  displayName: "NDIA Provider Claiming",

  isEnabled() {
    // This indicates a local readiness UI only, not NDIA credentials or approval.
    return isIntegrationEnvEnabled("ndia") && phase5Config.ndiaReadinessEnabled;
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    const evidence = getNdiaGatewayReadiness();
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "NDIA readiness disabled; no verified government connection",
      };
    }
    return {
      status: "degraded",
      message:
        "Local NDIA readiness enabled, but government API access and transport are not independently verified." +
        (evidence.legacySubmissionFlagObserved
          ? " Warning: legacy live-submission flag is set without verified access evidence."
          : ""),
    };
  },
};
