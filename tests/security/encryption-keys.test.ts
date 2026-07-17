import { afterEach, describe, expect, it } from "vitest";

import {
  decryptNdisNumber,
  encryptNdisNumber,
  EncryptionKeyUnavailableError,
} from "@/lib/crypto/ndis";
import {
  assertEncryptionKeyAvailable,
  resolveDataEncryptionKey,
} from "@/lib/security/encryption-keys";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("dedicated encryption keys", () => {
  it("uses NDIS_ENCRYPTION_KEY and never requires session secrets", () => {
    process.env.NDIS_ENCRYPTION_KEY = "unit-test-encryption-key-32b";
    process.env.MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK = "false";
    delete process.env.NEXTAUTH_SECRET;
    const material = resolveDataEncryptionKey(process.env);
    expect(material.version).toBeTruthy();
    expect(material.key).toHaveLength(32);
    expect(() => assertEncryptionKeyAvailable(process.env)).not.toThrow();
  });

  it("fails closed when dedicated key missing and fallback disallowed", () => {
    delete process.env.NDIS_ENCRYPTION_KEY;
    delete process.env.MAPABLE_DATA_ENCRYPTION_KEY;
    process.env.MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK = "false";
    process.env.NEXTAUTH_SECRET = "session-secret-must-not-work";
    process.env.NODE_ENV = "production";
    expect(() => resolveDataEncryptionKey(process.env)).toThrow(
      EncryptionKeyUnavailableError,
    );
  });

  it("round-trips NDIS encryption with versioned payload", () => {
    process.env.NDIS_ENCRYPTION_KEY = "unit-test-encryption-key-32b";
    process.env.MAPABLE_ENCRYPTION_KEY_VERSION = "v2";
    process.env.MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK = "false";
    const cipher = encryptNdisNumber("430123456");
    expect(cipher.startsWith("v2:")).toBe(true);
    expect(decryptNdisNumber(cipher)).toBe("430123456");
  });
});
