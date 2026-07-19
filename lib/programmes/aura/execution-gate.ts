/**
 * Programme ↔ AURA / AI-platform boundary (current main).
 *
 * Facts on main:
 * - `lib/aura/` proposal/execution stack is absent
 * - AI-platform authority ceilings live in `lib/ai-platform/types/authority.ts`
 * - Companion exposes device-local Stop AURA (`apps/companion/src/aura/stop-aura.ts`)
 *
 * Programme adapters may read governed proposals only.
 * Models cannot publish, certify, approve, consent, refer, book, pay, or execute.
 * Executable actions require participant authority + deterministic service path + not stopped.
 */

import type { AuthorityCeiling } from "@/lib/ai-platform/types/authority";
import { evaluateParticipantAuthority } from "@/lib/programmes/authority/participant-authority-service";
import {
  ForbiddenAuraAction,
  ProgrammeInvariantError,
  validateAuraProposalBoundary,
  type AuraProposalAction,
} from "@/lib/programmes/safety-invariants";

/** Process-local stop flag for server-side programme gates (mirrors companion stop). */
let programmeAuraStopped = false;

export function stopProgrammeAura(): void {
  programmeAuraStopped = true;
}

export function isProgrammeAuraStopped(): boolean {
  return programmeAuraStopped;
}

export function __resetProgrammeAuraStopForTests(): void {
  programmeAuraStopped = false;
}

export const PROGRAMME_AURA_CEILING: AuthorityCeiling =
  "SUGGEST_WITH_PARTICIPANT_APPROVAL";

export type ExecutableProgrammeAction =
  | "refer"
  | "book"
  | "pay"
  | "publish"
  | "certify"
  | "approve"
  | "consent"
  | "execute";

const DIRECT_WRITER_ACTIONS: ExecutableProgrammeAction[] = [
  "refer",
  "book",
  "pay",
  "publish",
  "certify",
  "approve",
  "consent",
  "execute",
];

export function assertProposalOnlyModelBoundary(input: {
  action: AuraProposalAction | ForbiddenAuraAction | string;
  textContent?: string;
  requiresParticipantApproval?: boolean;
}): void {
  validateAuraProposalBoundary(input);
}

/**
 * Refuse model-direct consequential writes. Execution must go through
 * deterministic services after participant authority checks.
 */
export function refuseDirectAuraWriter(
  action: ExecutableProgrammeAction | string,
): never {
  throw new ProgrammeInvariantError(
    "recommendation_not_determination",
    `Direct AURA/model writer refused for action: ${action}. Use deterministic programme services after participant authority.`,
  );
}

export async function assertProgrammeExecutionEligibility(input: {
  participantId: string;
  actorUserId: string;
  organisationId?: string | null;
  action: string;
  requiredFields?: string[];
}): Promise<void> {
  if (programmeAuraStopped) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Programme execution blocked: AURA/programme stop is active",
    );
  }

  if (
    DIRECT_WRITER_ACTIONS.includes(input.action as ExecutableProgrammeAction)
  ) {
    // Still require authority evaluation even for named executable verbs —
    // callers must not treat model output as authority.
  }

  const decision = await evaluateParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    purpose: input.action,
    requestedFields: input.requiredFields ?? [],
    requestedAction: input.action,
  });

  if (!decision.allowed) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      decision.reason ?? "Participant authority denied",
    );
  }
}

export function assertCrossTenantDenied(input: {
  actorOrganisationId: string | null | undefined;
  resourceOrganisationId: string | null | undefined;
}): void {
  if (
    input.actorOrganisationId &&
    input.resourceOrganisationId &&
    input.actorOrganisationId !== input.resourceOrganisationId
  ) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Cross-organisation programme access denied",
    );
  }
}

export function assertCrossParticipantDenied(input: {
  actorUserId: string;
  participantId: string;
  hasGrant: boolean;
}): void {
  if (input.actorUserId !== input.participantId && !input.hasGrant) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Cross-participant programme access denied without grant",
    );
  }
}
