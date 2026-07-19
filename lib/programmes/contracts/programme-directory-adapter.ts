export interface ProgrammeDirectoryEntry {
  id: string;
  name: string;
  organisationName: string;
  jurisdiction: string;
  category: string;
  description?: string;
  sourceRecordId?: string;
  lastVerifiedAt?: Date;
}

export interface ProgrammeDirectorySearchInput {
  jurisdiction?: string;
  category?: string;
  query?: string;
  programmeId?: string;
}

export interface ProgrammeDirectoryAdapter {
  readonly isMock: boolean;
  searchDirectory(
    input: ProgrammeDirectorySearchInput,
  ): Promise<ProgrammeDirectoryEntry[]>;
  getEntryById(id: string): Promise<ProgrammeDirectoryEntry | null>;
}
