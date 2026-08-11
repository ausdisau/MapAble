import { createHash } from "node:crypto";

import type { ActHandoff } from "@prisma/client";

import {
  createActHandoffFromHitl,
  getActHandoffForTenant,
} from "@/lib/act/handoff/service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { NAVIGATOR_AUDIT } from "@/lib/ai/navigator/gates";
import type { HarnessDecision } from "@/lib/aura-harness/types";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

export const NAVIGATOR_ESCALATION_REASONS = [
  "unclear_consent",
  "participant_request",
  "immediate_danger",
  "no_safe_match",
  "model_failure",
  "safeguarding_language",
  "stale_data",
] as const;

export type NavigatorEscalationReason =
  (typeof NAVIGATOR_ESCALATION_REASONS)[number];

export const EMERGENCY_GUIDANCE_AU =
  "This may be an emergency.\n\nPlease call 000 now if anyone is in immediate danger.\n\nA MapAble team member will also be notified. If you can, move to a safer place and ask a trusted person nearby for help.\n\nFor crisis support you can also call Lifeline on 13 11 14.";

export type NavigatorEscalationResult = {
  handoffId: string | null;
  status: string | null;
  reason: NavigatorEscalationReason;
  emergencyGuidance: string | null;
  message: string;
};

function assertReason(
  reason: string,
): asserts reason is NavigatorEscalationReason {
  if (
    !(NAVIGATOR_ESCALATION_REASONS as readonly string[]).includes(reason)
  ) {
    throw new Error(`NAVIGATOR_ESCALATION_UNKNOWN_REASON:${reason}`);
  }
}

function escalationMessage(reason: NavigatorEscalationReason): string {
  switch (reason) {
    case "unclear_consent":
      return "We could not confirm consent clearly. A human reviewer will follow up.";
    case "participant_request":
      return "Your request for human help has been sent to a MapAble team member.";
    case "immediate_danger":
      return "Emergency guidance provided. A human reviewer has been notified.";
    case "no_safe_match":
      return "No safe provider match was found. A human reviewer will help next.";
    case "model_failure":
      return "The assisted path failed safely. A human reviewer will continue.";
    case "safeguarding_language":
      return "Safeguarding language was detected. A human reviewer will follow up.";
    case "stale_data":
      return "Some information may be out of date. A human reviewer will check it.";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

function buildHitlDecision(reason: NavigatorEscalationReason): HarnessDecision {
  const critical = reason === "immediate_danger" || reason === "safeguarding_language";
  const gamma = critical ? 90 : 60;
  return {
    outcome: "HITL_PENDING",
    policyAction: "REQUIRE_HITL",
    profile: {
      actionId: `navigator.escalate.${reason}`,
      rawGamma: gamma,
      normalizedGamma: gamma,
      variance: 0,
      concentrationCoeff: critical ? 120 : 40,
      requiresHITL: true,
      highGamma: true,
      highConcentration: critical,
    },
    mitigation: null,
    reason: `navigator_escalation:${reason}`,
    guardrailIds: ["navigator.escalation"],
  };
}

/**
 * Create a Navigator escalation via ActHandoff (A2H).
 * Requires tenantId + participantId. Does not let the model adjudicate danger.
 */
export async function createNavigatorEscalation(input: {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  reason: string;
  sessionId?: string;
  passportId?: string;
  note?: string;
}): Promise<NavigatorEscalationResult> {
  if (!isNavigatorPilotEnabled()) {
    throw new Error("NAVIGATOR_PILOT_DISABLED");
  }

  if (!input.tenantId?.trim()) {
    throw new Error("NAVIGATOR_ESCALATION_TENANT_REQUIRED");
  }
  if (!input.participantId?.trim()) {
    throw new Error("NAVIGATOR_ESCALATION_PARTICIPANT_REQUIRED");
  }

  assertReason(input.reason);

  const emergencyGuidance =
    input.reason === "immediate_danger" ? EMERGENCY_GUIDANCE_AU : null;

  const fingerprint = createHash("sha256")
    .update(
      [
        "navigator.escalate",
        input.tenantId,
        input.participantId,
        input.reason,
        input.sessionId ?? "",
        input.passportId ?? "",
        // Bucket by minute so rapid repeats can dedupe without locking forever.
        String(Math.floor(Date.now() / 60_000)),
      ].join("|"),
    )
    .digest("hex");

  const decision = buildHitlDecision(input.reason);

  // Wrap Act handoff create — never auto-execute; model does not adjudicate.
  const handoff = await createActHandoffFromHitl({
    fingerprint,
    toolName: "navigator.provider_search.escalate",
    payload: {
      reason: input.reason,
      sessionId: input.sessionId ?? null,
      passportId: input.passportId ?? null,
      note: input.note ?? null,
      // Immediate danger is routed to humans; guidance is returned separately.
      emergencyRouted: input.reason === "immediate_danger",
    },
    decision,
    requesterUserId: input.actorUserId,
    tenantId: input.tenantId,
    participantId: input.participantId,
  });

  if (input.passportId) {
    await prisma.navigatorDecisionPassport.updateMany({
      where: {
        id: input.passportId,
        tenantId: input.tenantId,
        participantId: input.participantId,
      },
      data: { status: "escalated" },
    });
  }

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.escalationCreated,
    entityType: "ActHandoff",
    entityId: handoff?.id ?? "unavailable",
    metadata: {
      tenantId: input.tenantId,
      reason: input.reason,
      emergencyGuidanceReturned: Boolean(emergencyGuidance),
      handoffCreated: Boolean(handoff),
    },
  });

  return {
    handoffId: handoff?.id ?? null,
    status: handoff?.status ?? null,
    reason: input.reason,
    emergencyGuidance,
    message: escalationMessage(input.reason),
  };
}

/** Tenant-scoped escalation status (IDOR-safe via getActHandoffForTenant). */
export async function getEscalationStatus(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
}): Promise<Pick<
  ActHandoff,
  "id" | "status" | "tenantId" | "participantId" | "reason" | "createdAt" | "resolvedAt"
> | null> {
  if (!input.tenantId?.trim()) {
    throw new Error("NAVIGATOR_ESCALATION_TENANT_REQUIRED");
  }

  const handoff = await getActHandoffForTenant({
    id: input.id,
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
  });
  if (!handoff) return null;

  return {
    id: handoff.id,
    status: handoff.status,
    tenantId: handoff.tenantId,
    participantId: handoff.participantId,
    reason: handoff.reason,
    createdAt: handoff.createdAt,
    resolvedAt: handoff.resolvedAt,
  };
}
