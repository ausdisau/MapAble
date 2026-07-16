export interface ProgrammeOutcomeRecord {
  id: string;
  programmeId: string;
  missionId?: string;
  participantId: string;
  summary: string;
  recordedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ProgrammeOutcomeService {
  recordOutcome(input: {
    programmeId: string;
    participantId: string;
    missionId?: string;
    summary: string;
    metadata?: Record<string, unknown>;
    recordedById: string;
    correlationId: string;
  }): Promise<ProgrammeOutcomeRecord>;
}
