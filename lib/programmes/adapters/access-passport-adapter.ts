/**
 * AccessPassport Prisma model is absent on main.
 * Operational source: AccessibilityProfile + Communication Passport projection.
 * Replaceable interface — do not invent a second passport SoT.
 */

import { getCommunicationPassport } from "@/lib/communication-passport/service";
import type { CommunicationPassport } from "@/lib/communication-passport/types";

export type ProgrammeAccessPassportView = {
  participantId: string;
  source: "accessibility_profile_communication_passport";
  version: number;
  updatedAt: string;
  communicationModes: string[];
  disclosableFieldKeys: string[];
  /** Diagnosis must never appear here. */
  containsDiagnosis: false;
};

export interface ProgrammeAccessPassportAdapter {
  readonly isMock: boolean;
  readonly sourceLabel: string;
  getForParticipant(
    participantId: string,
  ): Promise<ProgrammeAccessPassportView | null>;
}

function fromCommunicationPassport(
  passport: CommunicationPassport,
): ProgrammeAccessPassportView {
  return {
    participantId: passport.participantId,
    source: "accessibility_profile_communication_passport",
    version: passport.version,
    updatedAt: passport.updatedAt,
    communicationModes: passport.instructions.map((i) => i.mode),
    disclosableFieldKeys: passport.disclosableFieldKeys,
    containsDiagnosis: false,
  };
}

class AccessibilityProfilePassportAdapter implements ProgrammeAccessPassportAdapter {
  readonly isMock = false;
  readonly sourceLabel =
    "AccessibilityProfile via Communication Passport projection";

  async getForParticipant(
    participantId: string,
  ): Promise<ProgrammeAccessPassportView | null> {
    try {
      const passport = await getCommunicationPassport(participantId);
      return fromCommunicationPassport(passport);
    } catch {
      return null;
    }
  }
}

let adapter: ProgrammeAccessPassportAdapter =
  new AccessibilityProfilePassportAdapter();

export function getProgrammeAccessPassportAdapter(): ProgrammeAccessPassportAdapter {
  return adapter;
}

export function __setProgrammeAccessPassportAdapterForTests(
  next: ProgrammeAccessPassportAdapter | null,
): void {
  adapter = next ?? new AccessibilityProfilePassportAdapter();
}
