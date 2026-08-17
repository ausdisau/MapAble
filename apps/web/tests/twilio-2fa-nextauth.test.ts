import { afterEach, describe, expect, it, vi } from "vitest";

describe("NextAuth Twilio 2FA enforcement", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("rejects password-only credentials when Twilio 2FA is enabled", async () => {
    vi.stubEnv("TWILIO_2FA_ENABLED", "true");
    vi.resetModules();

    const { authOptions } =
      await import("@/app/api/auth/[...nextauth]/authOptions");
    const credentialsProvider = authOptions.providers.find(
      (provider) => provider.id === "credentials",
    ) as
      | {
          authorize?: (credentials: {
            email: string;
            password: string;
          }) => Promise<unknown>;
        }
      | undefined;

    const result = await credentialsProvider?.authorize?.({
      email: "participant@example.com",
      password: "password123",
    });

    expect(result).toBeNull();
  });
});
