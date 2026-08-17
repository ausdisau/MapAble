/**
 * Platform Assurance (#278) proposes RegulatorySourceVersion — not merged.
 * Programme evidence uses ProgrammeSourceRecord.
 * This adapter is the future bridge; it must not copy #278's schema blindly.
 */

export type PlatformAssuranceSourceRef = {
  /** Opaque external id until Platform Assurance lands a canonical model. */
  regulatorySourceVersionId: string | null;
  programmeSourceRecordId: string;
  ownership: "programme_evidence_spine";
  assuranceAdapter: "future_platform_assurance";
  productionReady: false;
};

export interface PlatformAssuranceSourceAdapter {
  readonly isMock: boolean;
  readonly productionReady: false;
  linkProgrammeSource(input: {
    programmeSourceRecordId: string;
    regulatorySourceVersionId?: string | null;
  }): PlatformAssuranceSourceRef;
}

class DeferredPlatformAssuranceAdapter implements PlatformAssuranceSourceAdapter {
  readonly isMock = true;
  readonly productionReady = false as const;

  linkProgrammeSource(input: {
    programmeSourceRecordId: string;
    regulatorySourceVersionId?: string | null;
  }): PlatformAssuranceSourceRef {
    return {
      regulatorySourceVersionId: input.regulatorySourceVersionId ?? null,
      programmeSourceRecordId: input.programmeSourceRecordId,
      ownership: "programme_evidence_spine",
      assuranceAdapter: "future_platform_assurance",
      productionReady: false,
    };
  }
}

const adapter: PlatformAssuranceSourceAdapter =
  new DeferredPlatformAssuranceAdapter();

export function getPlatformAssuranceSourceAdapter(): PlatformAssuranceSourceAdapter {
  return adapter;
}
