function envApiKey(): string | undefined {
  return process.env.AUSPOST_PAC_API_KEY ?? process.env.AUSPOST_API_KEY;
}

export const auspostPacConfig = {
  get apiKey() {
    return envApiKey();
  },
  get baseUrl() {
    return (
      process.env.AUSPOST_PAC_API_BASE_URL?.replace(/\/$/, "") ??
      "https://digitalapi.auspost.com.au"
    );
  },
  get enabled() {
    return process.env.AUSPOST_PAC_ENABLED === "true";
  },
  get cacheTtlSeconds() {
    return Number(process.env.AUSPOST_PAC_CACHE_TTL_SECONDS ?? "3600");
  },
};

export function isAuspostPacConfigured(): boolean {
  return auspostPacConfig.enabled && Boolean(envApiKey()?.trim());
}

/** Suburb/postcode autocomplete via PAC when a server-side API key is configured. */
export function isAuspostPacLocationSearchAvailable(): boolean {
  return isAuspostPacConfigured();
}

/** Non-secret env visibility for production troubleshooting (no key values). */
export function getAuspostPacDiagnostics() {
  const pacKey = process.env.AUSPOST_PAC_API_KEY;
  const aliasKey = process.env.AUSPOST_API_KEY;
  const pacKeyTrimmed = pacKey?.trim() ?? "";
  const aliasKeyTrimmed = aliasKey?.trim() ?? "";
  const pacEnabled = process.env.AUSPOST_PAC_ENABLED === "true";

  return {
    pacEnabled,
    /** `AUSPOST_PAC_API_KEY` exists in `process.env` (may still be empty). */
    pacApiKeyDefined: pacKey !== undefined,
    pacApiKeyPresent: pacKeyTrimmed.length > 0,
    pacApiKeyLength: pacKeyTrimmed.length,
    auspostApiKeyAliasDefined: aliasKey !== undefined,
    auspostApiKeyAliasPresent: aliasKeyTrimmed.length > 0,
    auspostApiKeyAliasLength: aliasKeyTrimmed.length,
    auspostConfigured: isAuspostPacConfigured(),
    auspostLocationSearch: isAuspostPacLocationSearchAvailable(),
  };
}
