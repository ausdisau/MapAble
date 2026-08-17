import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasTwilioVerifyConfig,
  isTwilio2FAEnabled,
  maskPhoneNumber,
} from "@/lib/auth/twilio-verify";
import {
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "@/lib/auth/two-factor-token";

describe("two-factor auth tokens", () => {
  it("round-trips a token for the expected purpose", () => {
    const token = createTwoFactorToken({
      purpose: "twilio-2fa-challenge",
      userId: "user_123",
    });

    expect(verifyTwoFactorToken(token, "twilio-2fa-challenge")).toEqual({
      userId: "user_123",
    });
    expect(verifyTwoFactorToken(token, "credentials-2fa")).toBeNull();
  });

  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    try {
      const token = createTwoFactorToken({
        purpose: "credentials-2fa",
        ttlSeconds: 60,
        userId: "user_123",
      });

      vi.advanceTimersByTime(61_000);

      expect(verifyTwoFactorToken(token, "credentials-2fa")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Twilio Verify configuration helpers", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("detects whether Twilio 2FA is enabled and configured", () => {
    process.env = {
      ...env,
      TWILIO_2FA_ENABLED: "true",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_VERIFY_SERVICE_SID: "VA123",
    };

    expect(isTwilio2FAEnabled()).toBe(true);
    expect(hasTwilioVerifyConfig()).toBe(true);
  });

  it("masks phone numbers", () => {
    expect(maskPhoneNumber("+61 412 345 678")).toBe("•••• 5678");
  });
});
