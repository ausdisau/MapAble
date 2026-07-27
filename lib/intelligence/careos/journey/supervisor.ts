import { randomUUID } from "crypto";

import { decideProposedAction } from "@mapable/intelligence-kernel";

import { auditCareOSEvent } from "../audit/audit-service";
import type { CareOSContext } from "../context/careos-context";
import {
  createSimulationActionToken,
} from "../approvals/proposal-token";
import {
  planSupportedJourney,
  type JourneyOption,
} from "./supported-journey";

export async function superviseSupportedJourney(params: {
  request: Parameters<typeof planSupportedJourney>[0];
  context: CareOSContext;
}) {
  const journey = planSupportedJourney(params.request);
  const authority = {
    schemaVersion: "1.0" as const,
    id: `authority_${params.context.requestId}`,
    actorId: params.context.actor.userId,
    principalId: params.context.participant.participantId,
    tenantId: params.request.tenantId,
    domain: "transport" as const,
    permittedActions: ["simulate_confirm_supported_journey"],
    autonomyCeiling: 2 as const,
    constraints: {},
    jurisdiction: "AU" as const,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    revokedAt: null,
  };
  const supervisedOptions = journey.options.map((option: JourneyOption) => {
    const action = {
      id: randomUUID(),
      capability: "transport.journey-plan.propose",
      domain: "transport",
      purpose: "simulate a participant-selected supported appointment journey",
      participantId: params.context.participant.participantId,
      operation: "simulate_confirm_supported_journey",
      input: { optionId: option.id },
      evidence: option.verifiedEvidence.map((sourceId) => ({
        sourceType: "verified_platform_fact" as const,
        sourceId,
        timestamp: new Date().toISOString(),
        jurisdiction: "AU" as const,
        verificationStatus: "verified" as const,
      })),
      uncertainty: option.uncertainty,
      reversibility: "reversible" as const,
      autonomyLevel: 2 as const,
      confirmationRequired: true,
      expiresAt: authority.expiresAt,
    };
    const policy = decideProposedAction({
      action,
      authority,
      capabilityEnabled: true,
      evidenceComplete: option.missingEvidence.length === 0,
    });
    return {
      ...option,
      action,
      policy,
      confirmationToken:
        policy.decision === "REQUIRE_PARTICIPANT_CONFIRMATION"
          ? createSimulationActionToken({
              participantId: params.context.participant.participantId,
              actorId: params.context.actor.userId,
              actionId: action.id,
              capability: action.capability,
              payload: action.input,
              policyVersion: "careos-policy-1.0.0",
            })
          : null,
    };
  });
  await auditCareOSEvent(params.context, {
    action: "supported_journey_supervised",
    agent: "deterministic_supported_journey_supervisor",
    risk: "read",
    decision: "proposal_only",
    metadata: {
      optionCount: supervisedOptions.length,
      decisions: supervisedOptions.map((option) => option.policy.decision),
      evidenceIds: supervisedOptions.flatMap((option) => option.verifiedEvidence),
    },
  });
  return { ...journey, options: supervisedOptions };
}
