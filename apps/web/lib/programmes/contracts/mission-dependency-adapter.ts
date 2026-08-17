export interface MissionDependencyNode {
  id: string;
  type: string;
  label: string;
  status: string;
  responsibleOrganisation?: string;
  dueAt?: Date | null;
  isUnknown: boolean;
}

export interface MissionView {
  id: string;
  participantId: string;
  title: string;
  status: string;
  correlationId: string;
  dependencies: MissionDependencyNode[];
}

export interface CreateMissionInput {
  participantId: string;
  title: string;
  description?: string;
  createdById: string;
  correlationId?: string;
}

export interface MissionDependencyAdapter {
  readonly isMock: boolean;
  createMission(input: CreateMissionInput): Promise<MissionView>;
  getMission(missionId: string): Promise<MissionView | null>;
  listMissionsForParticipant(participantId: string): Promise<MissionView[]>;
  addDependency(
    missionId: string,
    dependency: Omit<MissionDependencyNode, "id">,
  ): Promise<MissionDependencyNode>;
}
