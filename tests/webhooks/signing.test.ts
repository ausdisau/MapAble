import { describe, expect, it } from "vitest";

import {
  computeRetryDelayMs,
  hashPayload,
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/platform/webhooks/signing";
import { developerPlatformConfig } from "@/lib/config/developer-platform";

describe("Webhook signing", () => {
  it("signs and verifies payloads", () => {
    const secret = "whsec_test_secret";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({ event: "care.shift.scheduled" });
    const signature = signWebhookPayload(secret, timestamp, payload);
    const result = verifyWebhookSignature({
      secret,
      timestamp,
      payload,
      signature,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects expired timestamps", () => {
    const secret = "whsec_test";
    const timestamp = String(Math.floor(Date.now() / 1000) - 600);
    const payload = "{}";
    const signature = signWebhookPayload(secret, timestamp, payload);
    const result = verifyWebhookSignature({
      secret,
      timestamp,
      payload,
      signature,
      maxAgeSeconds: 300,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("timestamp_expired");
  });

  it("hashes payloads consistently", () => {
    expect(hashPayload("abc")).toHaveLength(64);
    expect(hashPayload("abc")).toBe(hashPayload("abc"));
  });
});

describe("Webhook retry policy", () => {
  it("uses exponential backoff", () => {
    expect(computeRetryDelayMs(1, 60000)).toBe(120000);
    expect(computeRetryDelayMs(2, 60000)).toBe(240000);
  });

  it("respects max attempts config", () => {
    expect(developerPlatformConfig.webhookMaxAttempts).toBeGreaterThan(0);
  });
});

describe("Partner webhooks flag", () => {
  it("is disabled by default", () => {
    expect(developerPlatformConfig.partnerWebhooksEnabled).toBe(false);
  });
});
