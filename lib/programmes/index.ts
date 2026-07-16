export {
  PROGRAMME_IDS,
  PROGRAMME_INVARIANTS,
  ProgrammeInvariantError,
  assertDisclosureScope,
  assertProgrammeInvariant,
  assertUnknownPreserved,
  validateAuraProposalBoundary,
} from "@/lib/programmes/safety-invariants";
export type {
  AuraProposalAction,
  ForbiddenAuraAction,
  ProgrammeId,
  ProgrammeInvariantId,
} from "@/lib/programmes/safety-invariants";

export {
  createCorrelationId,
  emitProgrammeAuditEvent,
} from "@/lib/programmes/audit";
export type { ProgrammeAuditInput } from "@/lib/programmes/audit";

export {
  getProgrammeEnvVar,
  isProgrammeEnabled,
  programmeFlagsConfig,
  requireProgrammeEnabled,
  ProgrammeDisabledError,
} from "@/lib/config/programme-flags";

export {
  createProgrammeSourceRecord,
  createSourceImpactReview,
  getProgrammeSourceById,
  getSupersessionWarning,
  searchProgrammeSources,
} from "@/lib/programmes/source-registry/source-registry-service";

export {
  createParticipantAuthorityGrant,
  evaluateParticipantAuthority,
  participantAuthorityPolicy,
  revokeParticipantAuthorityGrant,
} from "@/lib/programmes/authority/participant-authority-service";

export {
  approveNavigatorRequest,
  assignNavigator,
  createNavigatorRequest,
  previewNavigatorAssignment,
  revokeNavigatorAssignment,
  searchNavigatorProfiles,
} from "@/lib/programmes/navigator/navigator-service";

export {
  addServiceRoleDisclosure,
  captureTrustRelationshipSnapshot,
  createServiceRelationshipRecord,
  getServiceRelationshipWithDisclosures,
} from "@/lib/programmes/trust-ledger/trust-relationship-service";

export {
  getCaseMissionAdapter,
  CaseMissionAdapter,
} from "@/lib/programmes/adapters/case-mission-adapter";
export {
  getFixtureProgrammeSourceAdapter,
  FixtureProgrammeSourceAdapter,
} from "@/lib/programmes/adapters/fixture-source-adapter";
export {
  getFixtureHumanNavigatorAdapter,
  FixtureHumanNavigatorAdapter,
} from "@/lib/programmes/adapters/fixture-navigator-adapter";

export {
  applicationPreflightService,
  documentChecklistService,
  evidenceAttachmentService,
  programmeExportService,
  programmeOutcomeService,
  programmeReferralService,
  resetProgrammeFoundationStoresForTests,
} from "@/lib/programmes/foundation-services";

export type { ProgrammeSourceAdapter } from "@/lib/programmes/contracts/programme-source-adapter";
export type { ProgrammeDirectoryAdapter } from "@/lib/programmes/contracts/programme-directory-adapter";
export type { HumanNavigatorAdapter } from "@/lib/programmes/contracts/human-navigator-adapter";
export type { ParticipantAuthorityPolicy } from "@/lib/programmes/contracts/participant-authority-policy";
export type { MissionDependencyAdapter } from "@/lib/programmes/contracts/mission-dependency-adapter";
