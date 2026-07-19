import { createHash } from "crypto";

export class EncryptionKeyUnavailableError extends Error {
  readonly status = 503;

  constructor(message = "Encryption key unavailable") {
    super(message);
    this.name = "EncryptionKeyUnavailableError";
  }
}

export type EncryptionKeyMaterial = {
  /** Logical key version for rotation (v1, v2, …). */
  version: string;
  /** 32-byte AES key. */
  key: Buffer;
};

/**
 * Resolve dedicated data-encryption material.
 * Never falls back to NEXTAUTH_SECRET / SESSION_SECRET.
 *
 * Production / preview: NDIS_ENCRYPTION_KEY or MAPABLE_DATA_ENCRYPTION_KEY required.
 * Local/test: MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK=true permits a labelled dev key.
 */
export function resolveDataEncryptionKey(
  env: NodeJS.ProcessEnv = process.env,
): EncryptionKeyMaterial {
  const version = (env.MAPABLE_ENCRYPTION_KEY_VERSION ?? "v1").trim() || "v1";
  const dedicated =
    env.NDIS_ENCRYPTION_KEY?.trim() ||
    env.MAPABLE_DATA_ENCRYPTION_KEY?.trim() ||
    "";

  if (dedicated.length >= 16) {
    return {
      version,
      key: createHash("sha256").update(dedicated).digest(),
    };
  }

  const allowDevFallback =
    env.MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK === "true" &&
    (env.NODE_ENV === "development" ||
      env.NODE_ENV === "test" ||
      env.VITEST === "true");

  if (allowDevFallback) {
    return {
      version: `${version}-dev`,
      key: createHash("sha256")
        .update("mapable-dev-encryption-only-not-for-production")
        .digest(),
    };
  }

  throw new EncryptionKeyUnavailableError(
    "Set NDIS_ENCRYPTION_KEY or MAPABLE_DATA_ENCRYPTION_KEY (min 16 chars). Session secrets must not be used for field encryption.",
  );
}

export function assertEncryptionKeyAvailable(
  env: NodeJS.ProcessEnv = process.env,
): void {
  resolveDataEncryptionKey(env);
}
