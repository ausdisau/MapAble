import { createHash, randomUUID } from "node:crypto";

import { z } from "zod";

import { createCareRequestSchema } from "@/lib/validation/care";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export const careOSExecutableActionSchema = z.enum([
  "submit_care_request",
  "submit_transport_request",
]);
export type CareOSExecutableAction = z.infer<typeof careOSExecutableActionSchema>;

export const careOSPrepareActionSchema = z.object({
  proposalId: z.string().uuid(),
  requestId: z.string().min(1),
  actionType: careOSExecutableActionSchema,
  proposalPayloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  payload: z.record(z.string(), z.unknown()),
  confirmedInformationToShare: z.array(z.string()).max(20),
});
export type CareOSPrepareActionInput = z.infer<typeof careOSPrepareActionSchema>;

export const careOSActionEnvelopeSchema = z.object({
  version: z.literal(1),
  tokenId: z.string().uuid(),
  proposalId: z.string().uuid(),
  requestId: z.string().min(1),
  participantId: z.string().min(1),
  actionType: careOSExecutableActionSchema,
  payload: z.record(z.string(), z.unknown()),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  informationToShare: z.array(z.string()).max(20),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type CareOSActionEnvelope = z.infer<typeof careOSActionEnvelopeSchema>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashCareOSPayload(payload: unknown): string {
  return createHash("sha256").update(canonical(payload)).digest("hex");
}

export function validateCareOSActionPayload(
  actionType: CareOSExecutableAction,
  payload: unknown,
): Record<string, unknown> {
  const parsed =
    actionType === "submit_care_request"
      ? createCareRequestSchema.parse(payload)
      : createTransportTripSchema.parse(payload);
  return parsed as Record<string, unknown>;
}

export function buildCareOSActionEnvelope(params: {
  proposalId: string;
  requestId: string;
  participantId: string;
  actionType: CareOSExecutableAction;
  payload: unknown;
  informationToShare: string[];
  lifetimeMinutes?: number;
}): CareOSActionEnvelope {
  const payload = validateCareOSActionPayload(params.actionType, params.payload);
  const issuedAt = new Date();
  return careOSActionEnvelopeSchema.parse({
    version: 1,
    tokenId: randomUUID(),
    proposalId: params.proposalId,
    requestId: params.requestId,
    participantId: params.participantId,
    actionType: params.actionType,
    payload,
    payloadHash: hashCareOSPayload(payload),
    informationToShare: params.informationToShare,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(
      issuedAt.getTime() + (params.lifetimeMinutes ?? 10) * 60_000,
    ).toISOString(),
  });
}
