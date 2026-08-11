import { createHash, randomBytes, randomUUID } from "node:crypto";

import { z } from "zod";

/** Draft-only actions allowed in Navigator Envelope v2 (Phase 1). */
export const governedEnvelopeActionSchema = z.enum([
  "create_service_request_draft",
  "transfer_filters_to_finder",
]);
export type GovernedEnvelopeAction = z.infer<typeof governedEnvelopeActionSchema>;

export const governedEnvelopeStatusSchema = z.enum([
  "proposed",
  "approved",
  "rejected",
  "expired",
  "executed_draft",
  "cancelled",
]);
export type GovernedEnvelopeStatus = z.infer<typeof governedEnvelopeStatusSchema>;

export const serviceRequestDraftPayloadSchema = z.object({
  serviceType: z.string().min(1).max(200),
  locationLabel: z.string().min(1).max(200),
  providerOutletIds: z.array(z.string().min(1)).max(20),
  notes: z.string().max(2000).optional(),
  hardConstraintsSummary: z.array(z.string().max(200)).max(30).optional(),
});

export const transferFiltersPayloadSchema = z.object({
  query: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  serviceQuery: z.string().max(200).optional(),
  accessQuery: z.string().max(200).optional(),
  providerName: z.string().max(200).optional(),
  appliedFilters: z.record(z.string(), z.unknown()).optional(),
});

export function validateGovernedEnvelopePayload(
  action: GovernedEnvelopeAction,
  payload: unknown,
): Record<string, unknown> {
  const parsed =
    action === "create_service_request_draft"
      ? serviceRequestDraftPayloadSchema.parse(payload)
      : transferFiltersPayloadSchema.parse(payload);
  return parsed as Record<string, unknown>;
}

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

export function hashGovernedPayload(payload: unknown): string {
  return createHash("sha256").update(canonical(payload)).digest("hex");
}

export function createEnvelopeNonce(): string {
  return randomBytes(24).toString("base64url");
}

export function createOpaqueEnvelopeId(): string {
  return randomUUID();
}

export const governedEnvelopeCreateSchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  initiatingUserId: z.string().min(1),
  capabilityKey: z.string().min(1),
  action: governedEnvelopeActionSchema,
  payload: z.record(z.string(), z.unknown()),
  evidenceRefs: z.array(z.string().max(200)).max(50).default([]),
  sourceRefs: z.array(z.string().max(200)).max(50).default([]),
  modelVersion: z.string().max(120).nullable().optional(),
  promptVersion: z.string().max(120).nullable().optional(),
  toolVersion: z.string().max(120).nullable().optional(),
  consentReceiptId: z.string().min(1),
  requiredApproverRole: z.string().min(1).max(80),
  lifetimeMinutes: z.number().int().min(1).max(24 * 60).optional(),
});

export type GovernedEnvelopeCreateInput = z.infer<
  typeof governedEnvelopeCreateSchema
>;
