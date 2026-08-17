export interface ProgrammeExportSection {
  title: string;
  body: string;
  sourceDate?: string;
  isUnknown?: boolean;
}

export interface ProgrammeExportPack {
  title: string;
  generatedAt: Date;
  sections: ProgrammeExportSection[];
  nonAiContacts: string[];
}

export interface ProgrammeExportService {
  generateOfflinePack(input: {
    programmeId: string;
    participantId: string;
    missionId?: string;
  }): Promise<ProgrammeExportPack>;
}
