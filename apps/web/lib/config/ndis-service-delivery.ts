/**
 * NDIS service delivery mechanism — authorization and delivery-event tracking.
 * Defaults off; enable when providers need delivery-mode gates before claiming.
 */
export const ndisServiceDeliveryConfig = {
  mechanismEnabled: process.env.NDIS_SERVICE_DELIVERY_MECHANISM_ENABLED === "true",
  /** Require an active authorization before claim-line validation passes. */
  requireAuthorizationForClaims:
    process.env.NDIS_SERVICE_DELIVERY_REQUIRE_AUTH_FOR_CLAIMS === "true",
  /** Require delivery mechanism on service logs before participant confirmation. */
  requireMechanismOnServiceLogs:
    process.env.NDIS_SERVICE_DELIVERY_REQUIRE_ON_SERVICE_LOGS === "true",
};

export function isNdisServiceDeliveryMechanismEnabled() {
  return ndisServiceDeliveryConfig.mechanismEnabled;
}
