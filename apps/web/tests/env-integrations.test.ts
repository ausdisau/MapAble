import { describe, expect, it, vi } from "vitest";

import {
  formatEnvIssues,
  validateIntegrationEnv,
  validateCoreEnv,
} from "@/lib/env";

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe("integration env validation", () => {
  it("disabled optional integration does not require env vars", () => {
    const origStripe = process.env.STRIPE_ENABLED;
    process.env.STRIPE_ENABLED = "false";
    const issues = validateIntegrationEnv().filter(
      (i) => i.integrationKey === "stripe",
    );
    process.env.STRIPE_ENABLED = origStripe;
    expect(issues.length).toBe(0);
  });

  it("enabled opensearch requires cluster credentials", () => {
    const origEnabled = process.env.OPENSEARCH_ENABLED;
    const origUrl = process.env.OPENSEARCH_URL;
    const origUser = process.env.OPENSEARCH_USERNAME;
    const origPass = process.env.OPENSEARCH_PASSWORD;

    process.env.OPENSEARCH_ENABLED = "true";
    delete process.env.OPENSEARCH_URL;
    delete process.env.OPENSEARCH_USERNAME;
    delete process.env.OPENSEARCH_PASSWORD;

    const issues = validateIntegrationEnv().filter(
      (i) => i.integrationKey === "opensearch",
    );

    restoreEnv("OPENSEARCH_ENABLED", origEnabled);
    restoreEnv("OPENSEARCH_URL", origUrl);
    restoreEnv("OPENSEARCH_USERNAME", origUser);
    restoreEnv("OPENSEARCH_PASSWORD", origPass);

    expect(issues.map((i) => i.variable)).toEqual(
      expect.arrayContaining([
        "OPENSEARCH_URL",
        "OPENSEARCH_USERNAME",
        "OPENSEARCH_PASSWORD",
      ]),
    );
  });

  it("enabled stripe requires STRIPE_SECRET_KEY", () => {
    const origEnabled = process.env.STRIPE_ENABLED;
    const origKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_ENABLED = "true";
    delete process.env.STRIPE_SECRET_KEY;
    const issues = validateIntegrationEnv().filter(
      (i) => i.integrationKey === "stripe",
    );
    process.env.STRIPE_ENABLED = origEnabled;
    process.env.STRIPE_SECRET_KEY = origKey;
    expect(issues.some((i) => i.variable === "STRIPE_SECRET_KEY")).toBe(true);
  });

  it("enabled Twilio 2FA requires Verify credentials", () => {
    const origEnabled = process.env.TWILIO_2FA_ENABLED;
    const origAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const origAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const origServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    process.env.TWILIO_2FA_ENABLED = "true";
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;

    const issues = validateIntegrationEnv().filter(
      (i) => i.integrationKey === "twilio_verify",
    );

    restoreEnv("TWILIO_2FA_ENABLED", origEnabled);
    restoreEnv("TWILIO_ACCOUNT_SID", origAccountSid);
    restoreEnv("TWILIO_AUTH_TOKEN", origAuthToken);
    restoreEnv("TWILIO_VERIFY_SERVICE_SID", origServiceSid);

    expect(issues.map((i) => i.variable)).toEqual(
      expect.arrayContaining([
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_VERIFY_SERVICE_SID",
      ]),
    );
  });

  it("formatEnvIssues does not include secret values", () => {
    const text = formatEnvIssues([
      {
        variable: "STRIPE_SECRET_KEY",
        message: "Required",
        integrationKey: "stripe",
      },
    ]);
    expect(text).not.toContain("sk_live");
    expect(text).toContain("STRIPE_SECRET_KEY");
  });
});

describe("core env validation", () => {
  it("production requires DATABASE_URL when NODE_ENV production", () => {
    const origDb = process.env.DATABASE_URL;
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.DATABASE_URL;
    const issues = validateCoreEnv();
    vi.unstubAllEnvs();
    process.env.DATABASE_URL = origDb;
    expect(issues.some((i) => i.variable === "DATABASE_URL")).toBe(true);
  });
});
