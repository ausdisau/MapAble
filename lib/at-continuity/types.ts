/**
 * AT Continuity DTOs — equipment continuity, not clinical suitability.
 * Marketplace taxonomy slugs are optional hints only; never the asset SoT.
 */

export type AtEquipmentCategory =
  | "mobility"
  | "communication"
  | "daily_living"
  | "other";

export type AtOutageStatus =
  | "draft"
  | "reported"
  | "active"
  | "resolved"
  | "closed"
  | "withdrawn";

export type AtDependencyTargetType =
  | "care_request"
  | "transport_trip"
  | "transport_trip_request"
  | "job"
  | "job_application"
  | "calendar_event";

export type AtEquipmentAssetInput = {
  participantUserId: string;
  displayName: string;
  category: AtEquipmentCategory;
  /** Aligns with presentation MobilityAid when category is mobility; not a clinical code. */
  mobilityAidHint?: string | null;
  /** Marketplace catalog slug hint only — not the equipment register SoT. */
  marketplaceCategoryHint?: string | null;
  /** External partner assessment reference (URL/id); MapAble does not certify suitability. */
  externalAssessmentRef?: string | null;
  notes?: string | null;
};

export type AtOutageInput = {
  assetId: string;
  participantUserId: string;
  summary: string;
  status?: AtOutageStatus;
  impactNotes?: string | null;
};

export type AtBackupPlanInput = {
  assetId: string;
  participantUserId: string;
  title: string;
  instructions: string;
  active?: boolean;
};

export type AtRepairPartnerRefInput = {
  assetId: string;
  participantUserId: string;
  organisationId: string;
  /** Optional external partner directory / assessment ref — not MapAble clinical SoT. */
  externalPartnerRef?: string | null;
  notes?: string | null;
};

export type AtDependencyLinkInput = {
  assetId: string;
  participantUserId: string;
  targetType: AtDependencyTargetType;
  targetEntityId: string;
  notes?: string | null;
};

/** Participant-facing notification intent — never auto-sent without human approval. */
export type AtNotificationRequestInput = {
  participantUserId: string;
  assetId: string;
  channel: "in_app" | "email";
  /** Template key / safe identifier — not free-text clinical narrative. */
  templateKey: string;
  humanApproved: boolean;
  approvedByUserId: string;
};
