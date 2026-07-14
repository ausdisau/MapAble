function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 12 — Open API and Partner Ecosystem.
 * Developer portal, versioned REST API, OAuth clients, webhooks, and audit logs.
 */
export const developerPlatformConfig = {
  enabled: enabled("MAPABLE_DEVELOPER_PLATFORM_ENABLED"),
  partnerWebhooksEnabled: enabled("MAPABLE_PARTNER_WEBHOOKS_ENABLED"),
  /** Service accounts must never inherit participant session authority. */
  serviceAccountParticipantAuthorityEnabled: false,
  /** Secrets are hashed at rest; raw values shown once at creation. */
  secretsShownOnce: true,
  defaultRateLimitPerMinute: Number(
    process.env.MAPABLE_API_RATE_LIMIT_PER_MINUTE ?? "60",
  ),
  webhookMaxAttempts: Number(process.env.MAPABLE_WEBHOOK_MAX_ATTEMPTS ?? "5"),
  webhookRetryBaseMs: Number(process.env.MAPABLE_WEBHOOK_RETRY_BASE_MS ?? "60000"),
} as const;

export type DeveloperPlatformConfig = typeof developerPlatformConfig;

export function ensureDeveloperPlatformEnabled() {
  if (!developerPlatformConfig.enabled) {
    throw new Error("DEVELOPER_PLATFORM_DISABLED");
  }
}

export function ensurePartnerWebhooksEnabled() {
  if (!developerPlatformConfig.partnerWebhooksEnabled) {
    throw new Error("PARTNER_WEBHOOKS_DISABLED");
  }
}
