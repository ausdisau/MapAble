import type {
  IncidentCategory,
  IncidentIntakePath,
  IncidentSeverity,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase4Config } from "@/lib/config/phase4";
import { y1WedgeConfig } from "@/lib/config/y1-wedge";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export type IncidentIntakeWizardSteps = {
  intakePath: IncidentIntakePath;
  participantIntent?: "report_only" | "want_help_resolving";
  careShiftId?: string;
  careBookingId?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  immediateRiskPresent?: boolean;
  possibleReportableIncident?: boolean;
  safeguardingConcern?: boolean;
  stepAnswers?: Record<string, unknown>;
};

export function validateIncidentIntakePath(steps: IncidentIntakeWizardSteps) {
  if (steps.intakePath === "safeguarding" && !steps.safeguardingConcern) {
    return "Safeguarding path requires safeguarding concern to be acknowledged.";
  }
  if (steps.intakePath === "concern" && steps.severity === "critical") {
    return "Critical severity should use the incident or safeguarding path.";
  }
  return null;
}

export async function createFromIntakeWizard(
  steps: IncidentIntakeWizardSteps & { reportedById: string; participantId?: string }
) {
  if (!phase4Config.incidentReportingEnabled) {
    throw new Error("INCIDENTS_DISABLED");
  }

  const validationError = validateIncidentIntakePath(steps);
  if (validationError) throw new Error(validationError);

  const category =
    steps.intakePath === "safeguarding"
      ? "safeguarding_concern"
      : steps.category;

  const incident = await prisma.incidentReport.create({
    data: {
      category,
      severity: steps.severity,
      title: steps.title,
      description: steps.description,
      reportedById: steps.reportedById,
      participantId: steps.participantId,
      careShiftId: steps.careShiftId,
      bookingId: steps.careBookingId,
      immediateRiskPresent: steps.immediateRiskPresent ?? false,
      possibleReportableIncident: steps.possibleReportableIncident ?? false,
      safeguardingConcern:
        steps.safeguardingConcern ?? steps.intakePath === "safeguarding",
      intakePath: y1WedgeConfig.incidentIntakeV2Enabled
        ? steps.intakePath
        : undefined,
      intakeMetadataJson: y1WedgeConfig.incidentIntakeV2Enabled
        ? ((steps.stepAnswers ?? {}) as Prisma.InputJsonValue)
        : undefined,
      participantIntent: steps.participantIntent,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: steps.reportedById,
    action: "incident.intake_wizard_created",
    entityType: "IncidentReport",
    entityId: incident.id,
    participantId: steps.participantId,
    metadata: { intakePath: steps.intakePath },
  });

  return incident;
}

export async function createIncident(params: {
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  reportedById: string;
  participantId?: string;
  bookingId?: string;
  careShiftId?: string;
  transportBookingId?: string;
  organisationId?: string;
  immediateRiskPresent?: boolean;
  possibleReportableIncident?: boolean;
  safeguardingConcern?: boolean;
  occurredAt?: Date;
}) {
  if (!phase4Config.incidentReportingEnabled) {
    throw new Error("INCIDENTS_DISABLED");
  }

  const incident = await prisma.incidentReport.create({
    data: {
      ...params,
      status: "draft",
    },
  });

  return incident;
}

export async function submitIncident(incidentId: string, actorUserId: string) {
  const existing = await prisma.incidentReport.findUnique({
    where: { id: incidentId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const incident = await prisma.incidentReport.update({
    where: { id: incidentId },
    data: {
      status: incidentNeedsTriage(existing) ? "triage" : "submitted",
    },
  });

  const full = incident;

  await createAuditEvent({
    actorUserId,
    action: "incident.submitted",
    entityType: "IncidentReport",
    entityId: incidentId,
    participantId: full.participantId ?? undefined,
  });

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });

  const category =
    full.severity === "critical" || full.immediateRiskPresent
      ? "safeguarding"
      : "booking";

  for (const a of admins) {
    await notifyUser(
      a.id,
      category,
      full.severity === "critical"
        ? "Critical incident requires acknowledgement"
        : "New incident submitted",
      full.title
    );
  }

  if (full.possibleReportableIncident) {
    await prisma.ndisRuleWarning.create({
      data: {
        sourceType: "incident",
        sourceId: incidentId,
        warningType: "possible_reportable_incident",
        severity: "warning",
        message:
          "Flagged as possible reportable incident — requires human review. Not submitted to NDIS Commission automatically.",
      },
    });
  }

  return incident;
}

function incidentNeedsTriage(
  incident: {
    severity: IncidentSeverity;
    immediateRiskPresent: boolean;
    safeguardingConcern: boolean;
  } | null
) {
  if (!incident) return false;
  return (
    incident.severity === "critical" ||
    incident.immediateRiskPresent ||
    incident.safeguardingConcern
  );
}

export async function acknowledgeCriticalIncident(
  incidentId: string,
  adminUserId: string
) {
  const incident = await prisma.incidentReport.update({
    where: { id: incidentId },
    data: {
      adminOwnerId: adminUserId,
      adminAcknowledgedAt: new Date(),
      status: "under_review",
    },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "incident.acknowledged",
    entityType: "IncidentReport",
    entityId: incidentId,
    participantId: incident.participantId ?? undefined,
  });

  const { createAttestation } = await import("@/lib/attestations/attestation-service");
  await createAttestation({
    type: "incident_triage_completed",
    actorUserId: adminUserId,
    entityType: "IncidentReport",
    entityId: incidentId,
    claim: "Admin acknowledged critical incident triage",
  });

  return incident;
}

export async function escalateIncident(incidentId: string, adminUserId: string) {
  return prisma.incidentReport.update({
    where: { id: incidentId },
    data: { status: "escalated", adminOwnerId: adminUserId },
  });
}

export async function escalateToQualitySafeguards(
  incidentId: string,
  actorUserId: string
) {
  const incident = await prisma.incidentReport.update({
    where: { id: incidentId },
    data: {
      status: "escalated",
      safeguardingConcern: true,
      escalatedToQscAt: new Date(),
      adminOwnerId: actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "incident.escalated_qsc",
    entityType: "IncidentReport",
    entityId: incidentId,
    participantId: incident.participantId ?? undefined,
    organisationId: incident.organisationId ?? undefined,
    metadata: {
      note: "Flagged for Quality & Safeguards Centre review — not auto-submitted to NDIS Commission.",
    },
  });

  await prisma.ndisRuleWarning.create({
    data: {
      sourceType: "incident",
      sourceId: incidentId,
      warningType: "quality_safeguards_escalation",
      severity: "warning",
      message:
        "Escalated to Quality & Safeguards Centre workflow for human review. This does not constitute NDIS funding approval or Commission submission.",
    },
  });

  return incident;
}

export async function resolveIncident(
  incidentId: string,
  adminUserId: string,
  resolutionSummary: string
) {
  const incident = await prisma.incidentReport.update({
    where: { id: incidentId },
    data: {
      status: "resolved",
      resolutionSummary,
      closedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "incident.resolved",
    entityType: "IncidentReport",
    entityId: incidentId,
  });

  return incident;
}

export async function addIncidentUpdate(
  incidentId: string,
  authorId: string,
  body: string
) {
  return prisma.incidentUpdate.create({
    data: { incidentId, authorId, body },
  });
}

export function sanitizeIncidentForRole(
  incident: { description: string; title: string },
  opts: { isAdmin: boolean; isParticipant: boolean; isOrgStaff: boolean }
) {
  if (opts.isAdmin || opts.isParticipant) return incident;
  if (opts.isOrgStaff) {
    return {
      title: incident.title,
      description: "Incident details available to authorised staff only.",
    };
  }
  return incident;
}
