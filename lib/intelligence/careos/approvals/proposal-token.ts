import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";

import { z } from "zod";

const payloadSchema = z.object({
  participantId: z.string(),
  scope: z.literal("profile.accessibility"),
  requestId: z.string(),
  expiresAt: z.string().datetime(),
});

type ProposalPayload = z.infer<typeof payloadSchema>;
const actionPayloadSchema = z.object({
  tokenId: z.string().uuid(),
  participantId: z.string(),
  actorId: z.string(),
  actionId: z.string(),
  capability: z.string(),
  payloadHash: z.string(),
  policyVersion: z.string(),
  expiresAt: z.string().datetime(),
});
const usedActionTokenIds = new Set<string>();

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("APPROVALS_UNAVAILABLE");
  return value;
}

function signature(encoded: string): string {
  return createHmac("sha256", secret()).update(encoded).digest("base64url");
}

export function createConsentProposalToken(
  participantId: string,
  requestId: string
): string {
  const payload: ProposalPayload = {
    participantId,
    requestId,
    scope: "profile.accessibility",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyConsentProposalToken(
  token: string,
  participantId: string
): ProposalPayload {
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) throw new Error("INVALID_PROPOSAL_TOKEN");
  const expected = signature(encoded);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    throw new Error("INVALID_PROPOSAL_TOKEN");
  }
  const payload = payloadSchema.parse(
    JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
  );
  if (payload.participantId !== participantId || new Date(payload.expiresAt) <= new Date()) {
    throw new Error("INVALID_PROPOSAL_TOKEN");
  }
  return payload;
}

export function createSimulationActionToken(input: {
  participantId: string;
  actorId: string;
  actionId: string;
  capability: string;
  payload: unknown;
  policyVersion: string;
}): string {
  const payload = {
    tokenId: randomUUID(),
    participantId: input.participantId,
    actorId: input.actorId,
    actionId: input.actionId,
    capability: input.capability,
    payloadHash: createHash("sha256").update(JSON.stringify(input.payload)).digest("hex"),
    policyVersion: input.policyVersion,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function consumeSimulationActionToken(input: {
  token: string;
  participantId: string;
  actorId: string;
  capability: string;
  payload: unknown;
}) {
  const [encoded, provided] = input.token.split(".");
  const expected = encoded ? signature(encoded) : "";
  if (!encoded || !provided || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    throw new Error("INVALID_ACTION_TOKEN");
  }
  const payload = actionPayloadSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
  if (
    payload.participantId !== input.participantId ||
    payload.actorId !== input.actorId ||
    payload.capability !== input.capability ||
    payload.payloadHash !== createHash("sha256").update(JSON.stringify(input.payload)).digest("hex") ||
    new Date(payload.expiresAt) <= new Date() ||
    usedActionTokenIds.has(payload.tokenId)
  ) throw new Error("INVALID_ACTION_TOKEN");
  usedActionTokenIds.add(payload.tokenId);
  return payload;
}
