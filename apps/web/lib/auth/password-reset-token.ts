import { createHmac } from "node:crypto";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";

const SEPARATOR = ".";
const TTL_SECONDS = 60 * 60; // 1 hour

export type PasswordResetTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

function signingSecret(): string | undefined {
  return resolveNextAuthSecret();
}

export function signPasswordResetToken(payload: {
  userId: string;
  email: string;
}): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const full: PasswordResetTokenPayload = {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}${SEPARATOR}${sig}`;
}

export function verifyPasswordResetToken(
  token: string
): PasswordResetTokenPayload | null {
  const secret = signingSecret();
  if (!secret) return null;

  const idx = token.lastIndexOf(SEPARATOR);
  if (idx === -1) return null;

  const encoded = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  if (sig !== expected) return null;

  try {
    const raw = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as PasswordResetTokenPayload;
    if (!payload.userId || !payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
