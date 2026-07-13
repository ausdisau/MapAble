import { createHmac, timingSafeEqual } from "node:crypto";

import {
  careOSActionEnvelopeSchema,
  type CareOSActionEnvelope,
} from "./action-envelope";

function approvalSecret(): string {
  const value = process.env.MAPABLE_AI_APPROVAL_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("MAPABLE_AI_APPROVAL_SECRET_NOT_CONFIGURED");
  }
  return value;
}

function signature(body: string): string {
  return createHmac("sha256", approvalSecret()).update(body).digest("base64url");
}

export function createCareOSActionToken(envelope: CareOSActionEnvelope): string {
  const body = Buffer.from(
    JSON.stringify(careOSActionEnvelopeSchema.parse(envelope)),
    "utf8",
  ).toString("base64url");
  return `${body}.${signature(body)}`;
}

export function verifyCareOSActionToken(token: string): CareOSActionEnvelope {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("INVALID_CAREOS_ACTION_TOKEN");
  const [body, supplied] = parts;
  if (!body || !supplied) throw new Error("INVALID_CAREOS_ACTION_TOKEN");

  const expected = signature(body);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("INVALID_CAREOS_ACTION_TOKEN");
  }

  const envelope = careOSActionEnvelopeSchema.parse(
    JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
  );
  if (Date.parse(envelope.expiresAt) <= Date.now()) {
    throw new Error("EXPIRED_CAREOS_ACTION_TOKEN");
  }
  return envelope;
}
