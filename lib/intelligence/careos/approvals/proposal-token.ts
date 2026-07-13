import { createHmac, timingSafeEqual } from "crypto";

import { z } from "zod";

const payloadSchema = z.object({
  participantId: z.string(),
  scope: z.literal("profile.accessibility"),
  requestId: z.string(),
  expiresAt: z.string().datetime(),
});

type ProposalPayload = z.infer<typeof payloadSchema>;

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
