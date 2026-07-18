export type MissionKind =
  | "starting_work"
  | "care_visit"
  | "transport_journey"
  | "continuity_recovery"
  | "billing_evidence";

export type MissionMaturity =
  | "synthetic_only"
  | "controlled_pilot"
  | "production_supported"
  | "retired";

export type MissionRegistration = {
  key: string;
  publicName: string;
  kind: MissionKind;
  maturity: MissionMaturity;
  featureFlag: string;
  canonicalProjection: string;
  writeOwners: string[];
  prohibitedWriters: string[];
  description: string;
};

export type MissionDependencyState =
  | "not_started"
  | "unknown"
  | "blocked"
  | "in_progress"
  | "confirmed"
  | "disputed"
  | "complete";

export type MissionDependencyItem = {
  id: string;
  label: string;
  domain: string;
  state: MissionDependencyState;
  responsibleParty: string;
  evidenceRefs: string[];
  blocksMission: boolean;
};

export type SharedMissionProjection = {
  missionKey: string;
  missionInstanceId: string;
  participantScope: string | null;
  organisationScope: string | null;
  goal: string;
  nextStep: string | null;
  dependencies: MissionDependencyItem[];
  unknowns: string[];
  disputed: string[];
  decisionsRequired: string[];
  productionClaim: "none";
  retrievedAt: string;
};
