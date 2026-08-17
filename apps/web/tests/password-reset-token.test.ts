import { afterEach, describe, expect, it, vi } from "vitest";

describe("password-reset-token", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("signs and verifies a reset token", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: "test-secret-min-16-chars",
    };

    const { signPasswordResetToken, verifyPasswordResetToken } = await import(
      "@/lib/auth/password-reset-token"
    );

    const token = signPasswordResetToken({
      userId: "user-1",
      email: "User@Test.com",
    });
    expect(token).toBeTruthy();

    const payload = verifyPasswordResetToken(token!);
    expect(payload).toMatchObject({
      userId: "user-1",
      email: "user@test.com",
    });
  });

  it("rejects tampered tokens", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: "test-secret-min-16-chars",
    };

    const { signPasswordResetToken, verifyPasswordResetToken } = await import(
      "@/lib/auth/password-reset-token"
    );

    const token = signPasswordResetToken({
      userId: "user-1",
      email: "user@test.com",
    })!;

    const tampered = `${token}x`;
    expect(verifyPasswordResetToken(tampered)).toBeNull();
  });
});
