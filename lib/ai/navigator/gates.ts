import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AiCapabilityRegistration } from "@/lib/ai/platform/capabilities/types";
import {
  assertModelCallAllowed,
  isCapabilityKilled,
} from "@/lib/ai/platform/policies/kill-switches";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";
import { navigatorPilotConfig } from "@/lib/config/navigator-pilot";

export const NAVIGATOR_AUDIT = {
  gateAllowed: "navigator.gate.allowed",
  gateDenied: "navigator.gate.denied",
  consentUsed: "navigator.consent.used",
  consentBlocked: "navigator.consent.blocked",
  envelopeCreated: "navigator.envelope.created",
  envelopeRejected: "navigator.envelope.rejected",
  envelopeExpired: "navigator.envelope.expired",
  envelopeReplayBlocked: "navigator.envelope.replay_blocked",
  prohibitionBlocked: "navigator.prohibition.blocked",
  escalationCreated: "navigator.escalation.created",
  passportCreated: "navigator.passport.created",
  passportCorrected: "navigator.passport.corrected",
  passportChallenged: "navigator.passport.challenged",
  passportSuggestionRejected: "navigator.passport.suggestion_rejected",
  passportAiOptOut: "navigator.passport.ai_opt_out",
  memoryUpserted: "navigator.memory.upserted",
  memoryCorrected: "navigator.memory.corrected",
  memoryWithdrawn: "navigator.memory.withdrawn",
  memoryDeleted: "navigator.memory.deleted",
} as const;

export type NavigatorGateContext = {
  capabilityKey: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  toolName?: string;
  /** When true, skip writing audit events (unit tests). */
  silent?: boolean;
};

export type NavigatorGateResult =
  | { allowed: true; capability: AiCapabilityRegistration }
  | { allowed: false; reason: string; capability?: AiCapabilityRegistration };

function isFeatureFlagEnabled(flagName: string): boolean {
  if (flagName === "MAPABLE_NAVIGATOR_PILOT_ENABLED") {
    return navigatorPilotConfig.enabled;
  }
  if (flagName === "MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED") {
    return navigatorPilotConfig.modelAssistedEnabled;
  }
  if (flagName === "MAPABLE_NAVIGATOR_PILOT_ENVELOPES") {
    return navigatorPilotConfig.envelopesEnabled;
  }
  if (flagName === "MAPABLE_NAVIGATOR_PILOT_PASSPORT") {
    return navigatorPilotConfig.passportEnabled;
  }
  if (flagName === "MAPABLE_NAVIGATOR_PILOT_MEMORY") {
    return navigatorPilotConfig.memoryEnabled;
  }
  if (flagName === "MAPABLE_NAVIGATOR_PILOT_MATCHING") {
    return navigatorPilotConfig.matchingEnabled;
  }
  // Unknown / other flags: fail closed unless explicitly "true".
  return process.env[flagName] === "true";
}

/**
 * Runtime enforcement for Navigator capabilities.
 * Rejects undeclared capabilities/tools; rechecks flag + kill switch.
 */
export async function assertNavigatorCapability(
  ctx: NavigatorGateContext,
): Promise<NavigatorGateResult> {
  let capability: AiCapabilityRegistration;
  try {
    capability = requireAiCapability(ctx.capabilityKey);
  } catch {
    await deny(ctx, "capability_not_registered");
    return { allowed: false, reason: "capability_not_registered" };
  }

  if (!ctx.capabilityKey.startsWith("navigator.")) {
    await deny(ctx, "not_navigator_capability", capability);
    return {
      allowed: false,
      reason: "not_navigator_capability",
      capability,
    };
  }

  if (!isFeatureFlagEnabled(capability.featureFlag)) {
    await deny(ctx, "feature_flag_disabled", capability);
    return { allowed: false, reason: "feature_flag_disabled", capability };
  }

  if (isCapabilityKilled(ctx.capabilityKey) || isCapabilityKilled(capability.killSwitchKey)) {
    await deny(ctx, "capability_kill_switch", capability);
    return { allowed: false, reason: "capability_kill_switch", capability };
  }

  const modelGate = assertModelCallAllowed({
    capabilityKey: ctx.capabilityKey,
    tenantId: ctx.tenantId,
  });
  // Deterministic capabilities still respect kill/tenant switches via assertModelCallAllowed;
  // model_generation_disabled only applies when a model would be invoked.
  if (
    !modelGate.allowed &&
    !(
      capability.backend === "deterministic" &&
      modelGate.reason === "model_generation_disabled"
    )
  ) {
    await deny(ctx, modelGate.reason ?? "model_call_blocked", capability);
    return {
      allowed: false,
      reason: modelGate.reason ?? "model_call_blocked",
      capability,
    };
  }

  if (ctx.toolName) {
    if (!capability.toolAllowlist.includes(ctx.toolName)) {
      await deny(ctx, "tool_not_allowlisted", capability);
      return { allowed: false, reason: "tool_not_allowlisted", capability };
    }
  }

  if (!ctx.silent) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      participantId: ctx.participantId,
      organisationId: null,
      action: NAVIGATOR_AUDIT.gateAllowed,
      entityType: "AiCapability",
      entityId: ctx.capabilityKey,
      metadata: {
        tenantId: ctx.tenantId,
        toolName: ctx.toolName ?? null,
        featureFlag: capability.featureFlag,
      },
    });
  }

  return { allowed: true, capability };
}

export function assertToolNotProhibited(toolOrAction: string): void {
  if (
    (PROHIBITED_AUTONOMOUS_ACTIONS as readonly string[]).includes(toolOrAction)
  ) {
    throw new Error(`NAVIGATOR_PROHIBITED_ACTION:${toolOrAction}`);
  }
}

/** Permanent Navigator pilot prohibitions (executable, not docs-only). */
export const NAVIGATOR_PILOT_PROHIBITED_ACTIONS = [
  "book_or_cancel_service",
  "approve_or_pay_payment",
  "change_participant_records",
  "disclose_sensitive_information",
  "determine_ndis_eligibility_or_funding",
  "make_clinical_recommendation",
  "authorise_restrictive_practice",
  "suspend_participant_worker_or_provider",
  "allege_fraud_abuse_or_misconduct",
  "submit_incident_or_regulatory_report",
] as const;

export type NavigatorPilotProhibitedAction =
  (typeof NAVIGATOR_PILOT_PROHIBITED_ACTIONS)[number];

export function isNavigatorPilotProhibited(
  action: string,
): action is NavigatorPilotProhibitedAction {
  return (NAVIGATOR_PILOT_PROHIBITED_ACTIONS as readonly string[]).includes(
    action,
  );
}

export function assertNavigatorActionAllowed(action: string): void {
  assertToolNotProhibited(action);
  if (isNavigatorPilotProhibited(action)) {
    throw new Error(`NAVIGATOR_PILOT_PROHIBITED:${action}`);
  }
}

async function deny(
  ctx: NavigatorGateContext,
  reason: string,
  capability?: AiCapabilityRegistration,
): Promise<void> {
  if (ctx.silent) return;
  await createAuditEvent({
    actorUserId: ctx.actorUserId,
    participantId: ctx.participantId,
    action: NAVIGATOR_AUDIT.gateDenied,
    entityType: "AiCapability",
    entityId: ctx.capabilityKey,
    metadata: {
      tenantId: ctx.tenantId,
      reason,
      toolName: ctx.toolName ?? null,
      featureFlag: capability?.featureFlag ?? null,
    },
  });
}
