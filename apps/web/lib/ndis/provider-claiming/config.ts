import { phase5Config } from "@/lib/config/phase5";

export const ndiaProviderClaimingConfig = {
  /** NDIA PACE / Payments API base (set after partner onboarding). */
  apiBaseUrl: process.env.NDIA_PROVIDER_API_BASE_URL ?? "",
  apiClientId: process.env.NDIA_PROVIDER_API_CLIENT_ID ?? "",
  apiClientSecret: process.env.NDIA_PROVIDER_API_CLIENT_SECRET ?? "",
  /** OAuth token endpoint when using client credentials. */
  tokenUrl: process.env.NDIA_PROVIDER_TOKEN_URL ?? "",
  /** Use `mock` until NDIA credentials are issued. */
  adapterMode: (process.env.NDIA_PROVIDER_ADAPTER_MODE ?? "mock") as
    | "mock"
    | "http",
  requireHumanApproval:
    process.env.NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL !== "false",
};

export function isNdiaProviderClaimingEnabled(): boolean {
  return phase5Config.ndisClaimSubmissionEnabled;
}

export function isNdiaProviderLiveSubmitAllowed(): boolean {
  return (
    isNdiaProviderClaimingEnabled() &&
    phase5Config.ndiaRealSubmissionEnabled &&
    ndiaProviderClaimingConfig.adapterMode === "http" &&
    Boolean(ndiaProviderClaimingConfig.apiBaseUrl)
  );
}
