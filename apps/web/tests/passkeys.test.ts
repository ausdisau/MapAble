import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "@/lib/auth/two-factor-token";

const schemaSource = readFileSync(
  join(process.cwd(), "prisma/schema.prisma"),
  "utf8",
);
const profilePageSource = readFileSync(
  join(process.cwd(), "app/dashboard/profile/page.tsx"),
  "utf8",
);
const loginClientSource = readFileSync(
  join(process.cwd(), "app/login/LoginClient.tsx"),
  "utf8",
);

describe("passkey support", () => {
  it("adds a persistent passkey credential model", () => {
    expect(schemaSource).toContain("model PasskeyCredential");
    expect(schemaSource).toContain("passkeyCredentials");
    expect(schemaSource).toContain("credentialId String    @unique");
  });

  it("adds passkey management to the profile page", () => {
    expect(profilePageSource).toContain("PasskeyRegistrationPanel");
    expect(profilePageSource).toContain("passkeyCredential.count");
  });

  it("adds a passkey login mode to the login client", () => {
    expect(loginClientSource).toContain("Login with passkey");
    expect(loginClientSource).toContain("/api/passkeys/login/options");
    expect(loginClientSource).toContain("/api/passkeys/login/verify");
  });

  it("round-trips passkey auth challenge tokens", () => {
    const token = createTwoFactorToken({
      challenge: "challenge-123",
      purpose: "passkey-authentication",
      userId: "user_123",
    });

    expect(verifyTwoFactorToken(token, "passkey-authentication")).toEqual({
      challenge: "challenge-123",
      userId: "user_123",
    });
  });
});
