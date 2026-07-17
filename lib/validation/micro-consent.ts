import { z } from "zod";

const microActions = [
  "support_profile.share_coordinator",
  "support_profile.share_worker",
  "match.backup_candidates",
  "match.review",
  "plan_manager.invoice_view",
  "coordinator.participant_access",
  "orchestration.share_transport",
  "orchestration.share_care_location",
  "reconciliation.metadata_share",
] as const;

export const microConsentGrantSchema = z
  .object({
    action: z.literal("grant").optional(),
    microAction: z.enum(microActions),
    purpose: z.string().min(3).max(500).optional(),
    grantedToUserId: z.string().min(1).optional(),
    grantedToOrganisationId: z.string().min(1).optional(),
    shareMode: z.enum(["once", "always_for_service"]).optional(),
  })
  .strict();

export const microConsentRevokeSchema = z
  .object({
    action: z.literal("revoke"),
    consentId: z.string().min(1),
  })
  .strict();

export const microConsentPostSchema = z.union([
  microConsentRevokeSchema,
  microConsentGrantSchema,
]);
