import { describe, expect, it } from "vitest";

import {
  EncryptionKeyUnavailableError,
  resolveDataEncryptionKey,
} from "@/lib/security/encryption-keys";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("encryption key fail-closed", () => {
  it("refuses to fall back to NEXTAUTH_SECRET", () => {
    expect(() =>
      resolveDataEncryptionKey(
        env({
          NODE_ENV: "production",
          NEXTAUTH_SECRET: "session-secret-at-least-16",
        }),
      ),
    ).toThrow(EncryptionKeyUnavailableError);
  });

  it("accepts a dedicated encryption key without printing it", () => {
    const material = resolveDataEncryptionKey(
      env({
        NDIS_ENCRYPTION_KEY: "dedicated-encryption-key-value",
      }),
    );
    expect(material.key).toBeInstanceOf(Buffer);
    expect(material.key.byteLength).toBe(32);
  });

  it("rejects NEXT_PUBLIC-style leakage patterns for encryption material", () => {
    // Dedicated key must not be a NEXT_PUBLIC_* variable — absence fails closed.
    expect(() =>
      resolveDataEncryptionKey(
        env({
          NODE_ENV: "production",
          NEXT_PUBLIC_NDIS_ENCRYPTION_KEY: "should-never-work",
        }),
      ),
    ).toThrow(EncryptionKeyUnavailableError);
  });
});
