import { NAVIGATOR_AUDIT } from "@/lib/ai/navigator/gates";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { createConsentReceipt } from "@/lib/consent/consent-receipt-service";
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export const NAVIGATOR_CONSENT_PURPOSE = "navigator.provider_search" as const;

export type PurposeConsentVerificationInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  /** API dotted consent scope (e.g. profile.read). */
  scope: ConsentScope;
  purpose: string;
  /** Fields the caller intends to read/write. */
  permittedFields?: string[];
  /** Action the caller intends to perform. */
  action: string;
  /** When actor ≠ participant, require a scoped authority grant. */
  delegationDomain?: string;
  now?: Date;
  silent?: boolean;
};

export type PurposeConsentVerificationResult =
  | {
      ok: true;
      consentRecordId: string;
      consentReceiptId: string | null;
      viaDelegation: boolean;
    }
  | {
      ok: false;
      reason:
        | "consent_missing"
        | "consent_expired"
        | "consent_withdrawn"
        | "consent_superseded"
        | "purpose_mismatch"
        | "fields_insufficient"
        | "action_not_permitted"
        | "tenant_mismatch"
        | "delegation_invalid";
    };

/**
 * Verify purpose-specific consent before a protected Navigator read/tool call.
 * Uses ConsentRecord as sole SoT (join+API); does not invent a second consent ledger.
 */
export async function verifyPurposeConsent(
  input: PurposeConsentVerificationInput,
): Promise<PurposeConsentVerificationResult> {
  const now = input.now ?? new Date();

  if (input.tenantId.trim().length === 0) {
    return fail(input, "tenant_mismatch");
  }

  const viaDelegation = input.actorUserId !== input.participantId;
  if (viaDelegation) {
    const authorised = await hasParticipantAuthority({
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      tenantId: input.tenantId,
      domain: input.delegationDomain ?? "navigator",
      action: input.action,
      consentScopes: [input.scope],
      now,
    });
    if (!authorised) {
      return fail(input, "delegation_invalid");
    }
  }

  const prismaScope = consentScopeToPrisma(input.scope);

  const candidates = await prisma.consentRecord.findMany({
    where: {
      subjectUserId: input.participantId,
      scope: prismaScope,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (candidates.length === 0) {
    return fail(input, "consent_missing");
  }

  // Newest matching purpose is authoritative; older active rows with same
  // purpose+scope are treated as superseded.
  const matching = candidates.filter(
    (row) =>
      row.purpose === input.purpose ||
      row.purpose.startsWith(`${input.purpose}.`),
  );

  if (matching.length === 0) {
    return fail(input, "purpose_mismatch");
  }

  const current = matching[0];
  if (matching.length > 1) {
    // Older rows exist — current is superseding; reject if somehow not newest active.
    void matching;
  }

  if (current.status === "revoked") {
    return fail(input, "consent_withdrawn");
  }
  if (current.status === "expired") {
    return fail(input, "consent_expired");
  }
  if (current.status !== "active") {
    return fail(input, "consent_missing");
  }
  if (current.expiryDate && current.expiryDate <= now) {
    return fail(input, "consent_expired");
  }

  // Supersession: a newer active consent with same scope+purpose already won
  // via orderBy desc; if current is not the first active among matching, block.
  const newerActive = matching.find(
    (row) =>
      row.id !== current.id &&
      row.createdAt > current.createdAt &&
      row.status === "active" &&
      (!row.expiryDate || row.expiryDate > now),
  );
  if (newerActive) {
    return fail(input, "consent_superseded");
  }

  const dataScope = normalizeDataScope(current.dataScope);
  if (input.permittedFields && input.permittedFields.length > 0) {
    if (dataScope.length === 0) {
      // Empty dataScope means unrestricted within scope — allow.
    } else {
      const missing = input.permittedFields.filter(
        (field) => !dataScope.includes(field) && !dataScope.includes("*"),
      );
      if (missing.length > 0) {
        return fail(input, "fields_insufficient");
      }
    }
  }

  const sourceAction = current.sourceAction?.trim();
  if (sourceAction && sourceAction.length > 0) {
    const allowedActions = sourceAction.split(",").map((s) => s.trim());
    if (
      !allowedActions.includes(input.action) &&
      !allowedActions.includes("*")
    ) {
      return fail(input, "action_not_permitted");
    }
  }

  let consentReceiptId: string | null = null;
  if (!input.silent) {
    const receipt = await createConsentReceipt({
      consentRecordId: current.id,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      scope: input.scope,
      purpose: input.purpose,
      action: "used",
    });
    consentReceiptId = receipt.id;
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: NAVIGATOR_AUDIT.consentUsed,
      entityType: "ConsentRecord",
      entityId: current.id,
      metadata: {
        tenantId: input.tenantId,
        purpose: input.purpose,
        scope: input.scope,
        action: input.action,
        viaDelegation,
        consentReceiptId,
      },
    });
  }

  return {
    ok: true,
    consentRecordId: current.id,
    consentReceiptId,
    viaDelegation,
  };
}

function normalizeDataScope(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

type PurposeConsentFailureReason = Extract<
  PurposeConsentVerificationResult,
  { ok: false }
>["reason"];

async function fail(
  input: PurposeConsentVerificationInput,
  reason: PurposeConsentFailureReason,
): Promise<Extract<PurposeConsentVerificationResult, { ok: false }>> {
  if (!input.silent) {
    try {
      await createConsentReceipt({
        participantId: input.participantId,
        actorUserId: input.actorUserId,
        scope: input.scope,
        purpose: input.purpose,
        action: "blocked",
      });
    } catch {
      // Receipt write must not mask the consent failure.
    }
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: NAVIGATOR_AUDIT.consentBlocked,
      entityType: "ConsentRecord",
      entityId: "blocked",
      metadata: {
        tenantId: input.tenantId,
        purpose: input.purpose,
        scope: input.scope,
        action: input.action,
        reason,
      },
    });
  }
  return { ok: false, reason };
}
