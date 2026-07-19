import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { isStripeIntegrationEnabled } from "@/lib/stripe/config";

export const stripeAdapter: IntegrationAdapter = {
  key: "stripe",
  type: "finance",
  displayName: "Stripe",

  isEnabled() {
    return isIntegrationEnvEnabled("stripe") && isStripeIntegrationEnabled();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "Stripe not configured (STRIPE_SECRET_KEY / STRIPE_ENABLED)",
      };
    }
    return { status: "healthy", message: "Stripe credentials present" };
  },
};
