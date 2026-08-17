import type { ProgrammeSourceType } from "@prisma/client";

export interface ProgrammeSourceRecordView {
  id: string;
  sourceOrganisation: string;
  jurisdiction: string;
  title: string;
  sourceType: ProgrammeSourceType;
  version: string;
  effectiveDate?: Date | null;
  expiryDate?: Date | null;
  authorityStatus: string;
  affectedProgrammes: string[];
  isSuperseded: boolean;
  supersedingSourceId?: string | null;
}

export interface ProgrammeSourceSearchInput {
  jurisdiction?: string;
  sourceType?: ProgrammeSourceType;
  programmeId?: string;
  query?: string;
}

export interface ProgrammeSourceAdapter {
  readonly isMock: boolean;
  searchSources(
    input: ProgrammeSourceSearchInput,
  ): Promise<ProgrammeSourceRecordView[]>;
  getSourceById(id: string): Promise<ProgrammeSourceRecordView | null>;
  getSupersessionWarning(
    id: string,
  ): Promise<{ superseded: boolean; message?: string }>;
}
