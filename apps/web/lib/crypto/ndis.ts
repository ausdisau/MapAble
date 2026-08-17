import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import {
  EncryptionKeyUnavailableError,
  resolveDataEncryptionKey,
} from "@/lib/security/encryption-keys";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  return resolveDataEncryptionKey().key;
}

/**
 * Encrypt an NDIS number (or similar identifier).
 * Payload format: `version:iv:tag:ciphertext` (base64 segments after version).
 * Legacy payloads without version (`iv:tag:data`) are still decryptable with current key.
 */
export function encryptNdisNumber(value: string): string {
  const { version, key } = resolveDataEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${version}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptNdisNumber(payload: string): string | null {
  try {
    const parts = payload.split(":");
    let ivB64: string | undefined;
    let tagB64: string | undefined;
    let dataB64: string | undefined;

    if (parts.length === 4) {
      [, ivB64, tagB64, dataB64] = parts;
    } else if (parts.length === 3) {
      [ivB64, tagB64, dataB64] = parts;
    } else {
      return null;
    }

    if (!ivB64 || !tagB64 || !dataB64) return null;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch (err) {
    if (err instanceof EncryptionKeyUnavailableError) throw err;
    return null;
  }
}

export function maskNdisNumber(value: string): string {
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

export { EncryptionKeyUnavailableError };
