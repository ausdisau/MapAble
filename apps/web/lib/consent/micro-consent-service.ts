import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import {
  isMicroConsentActive,
  y2OrchestrationConfig,
} from "@/lib/config/y2-orchestration";
import {
  checkConsent,
  grantConsent,
  listConsentsForParticipant,
  revokeConsent,
} from "@/lib/consent/consent-service";
import { requireConsent } from "@/lib/consent/require-consent";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export type MicroConsentAction =
  | "support_profile.share_coordinator"
  | "support_profile.share_worker"
  | "match.backup_candidates"
  | "match.review"
  | "plan_manager.invoice_view"
  | "coordinator.participant_access"
  | "orchestration.share_transport"
  | "orchestration.share_care_location"
  | "reconciliation.metadata_share";

const ACTION_SCOPE: Record<MicroConsentAction, ConsentScope> = {
  "support_profile.share_coordinator": "support_coordination.access",
  "support_profile.share_worker": "support_profile.read",
  "match.backup_candidates": "booking.manage",
  "match.review": "booking.manage",
  "plan_manager.invoice_view": "plan_manager.invoice_access",
  "coordinator.participant_access": "support_coordination.access",
  "orchestration.share_transport": "transport.accessibility_share",
  "orchestration.share_care_location": "care.accessibility_share",
  "reconciliation.metadata_share": "billing.read",
};

export const MICRO_CONSENT_ACTIONS = Object.keys(
  ACTION_SCOPE
) as MicroConsentAction[];

export function isMicroConsentEnabled() {
  return (
    isMicroConsentActive() && platformPatternsConfig.consentSharingPanelEnabled
  );
}

export function isMicroConsentV2Enabled() {
  return y2OrchestrationConfig.microConsentV2Enabled;
}

export async function requireMicroConsent(params: {
  action: MicroConsentAction;
  subjectUserId: string;
  actorUserId: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}) {
  if (!isMicroConsentEnabled()) return;

  await requireConsent({
    subjectUserId: params.subjectUserId,
    scope: ACTION_SCOPE[params.action],
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
    actorUserId: params.actorUserId,
  });
}

export async function hasMicroConsent(params: {
  action: MicroConsentAction;
  subjectUserId: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}) {
  return checkConsent({
    subjectUserId: params.subjectUserId,
    scope: ACTION_SCOPE[params.action],
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
  });
}

export async function recordMicroConsentGrant(params: {
  action: MicroConsentAction;
  subjectUserId: string;
  createdById: string;
  purpose: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  shareMode?: "once" | "always_for_service";
}) {
  const record = await grantConsent({
    subjectUserId: params.subjectUserId,
    scope: ACTION_SCOPE[params.action],
    purpose: params.purpose,
    createdById: params.createdById,
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
    shareMode: params.shareMode ?? "once",
    recipientType: params.grantedToOrganisationId
      ? "organisation"
      : params.action.startsWith("plan_manager")
        ? "plan_manager"
        : params.action.startsWith("coordinator")
          ? "support_coordinator"
          : "worker",
    dataScope: [ACTION_SCOPE[params.action]],
    sourceAction: params.action,
  });

  if (isMicroConsentV2Enabled()) {
    await createAuditEvent({
      actorUserId: params.createdById,
      action: "consent.micro.granted",
      entityType: "ConsentRecord",
      entityId: record.id,
      participantId: params.subjectUserId,
      metadata: { action: params.action },
    });
  }

  return record;
}

export async function revokeMicroConsent(params: {
  consentId: string;
  revokedById: string;
}) {
  const record = await revokeConsent(params.consentId, params.revokedById);

  if (isMicroConsentV2Enabled()) {
    await createAuditEvent({
      actorUserId: params.revokedById,
      action: "consent.micro.revoked",
      entityType: "ConsentRecord",
      entityId: record.id,
      participantId: record.subjectUserId,
    });
  }

  return record;
}

export async function listMicroConsentsForParticipant(subjectUserId: string) {
  const records = await listConsentsForParticipant(subjectUserId);
  return records.filter(
    (r) =>
      r.sourceAction &&
      MICRO_CONSENT_ACTIONS.includes(r.sourceAction as MicroConsentAction)
  );
}

export async function exportConsentAuditCsv(options?: {
  pseudonymiseParticipants?: boolean;
  since?: Date;
}) {
  const since = options?.since ?? new Date(Date.now() - 30 * 86400000);

  const events = await prisma.auditEvent.findMany({
    where: {
      action: { in: ["consent.micro.granted", "consent.micro.revoked", "consent.granted", "consent.revoked"] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const header = "id,action,participantId,entityId,createdAt\n";
  const rows = events
    .map((e) => {
      const pid = options?.pseudonymiseParticipants
        ? e.participantId
          ? `p_${e.participantId.slice(0, 8)}`
          : ""
        : (e.participantId ?? "");
      return `${e.id},${e.action},${pid},${e.entityId ?? ""},${e.createdAt.toISOString()}`;
    })
    .join("\n");

  return header + rows;
}
