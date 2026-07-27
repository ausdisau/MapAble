import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isCommunicationPassportEnabled } from "@/lib/config/communication-workforce";
import { trustFabricConfig } from "@/lib/config/trust-fabric";
import { prisma } from "@/lib/prisma";
import { getCommunicationPassport } from "@/lib/support/communication-passport/service";
import {
  assertTrustFabricEnabled,
  listParticipantAccessHistory,
  recordPurposeBoundAccessReceipt,
  TrustFabricError,
} from "@/lib/trust/fabric/receipt-service";
import type { TrustFabricExportBundle } from "@/lib/trust/fabric/types";

/**
 * Machine-readable portable export — participant leaves without losing their information.
 * Does not create a new consent source of truth.
 */
export async function exportParticipantTrustBundle(
  participantId: string,
  viewerUserId: string,
): Promise<TrustFabricExportBundle> {
  assertTrustFabricEnabled();
  if (participantId !== viewerUserId) {
    throw new TrustFabricError("Access denied", 403);
  }

  let communicationPassport: unknown | null = null;
  if (isCommunicationPassportEnabled()) {
    try {
      communicationPassport = await getCommunicationPassport(participantId);
    } catch {
      communicationPassport = null;
    }
  }

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: participantId },
    select: {
      mobilityNeeds: true,
      transportRequirements: true,
      sensoryPreferences: true,
      digitalPreferences: true,
    },
  });

  const consents = await prisma.consentRecord.findMany({
    where: { subjectUserId: participantId, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      purpose: true,
      scope: true,
      status: true,
      expiryDate: true,
    },
  });

  const accessHistorySummaries = await listParticipantAccessHistory(
    participantId,
    viewerUserId,
  );

  const careLogs = await prisma.careServiceLog.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  const trips = await prisma.transportTrip.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, createdAt: true },
  });

  const serviceHistorySummaries = [
    ...careLogs.map((log) => ({
      kind: "care_service_log",
      id: log.id,
      status: log.status,
      summary: `Care service log recorded ${log.createdAt.toISOString()}`,
    })),
    ...trips.map((trip) => ({
      kind: "transport_trip",
      id: trip.id,
      status: String(trip.status),
      summary: `Transport trip status ${trip.status}`,
    })),
  ];

  await recordPurposeBoundAccessReceipt({
    actorUserId: viewerUserId,
    participantId,
    purpose: "participant_portability_export",
    fieldCategories: [
      "communication_preferences",
      "access_requirements",
      "active_authority",
      "service_history_summary",
    ],
    authoritySource: "participant_self",
    outcome: "exported",
  });

  await createAuditEvent({
    actorUserId: viewerUserId,
    action: "trust_fabric.export.created",
    entityType: "TrustFabricExport",
    entityId: participantId,
    participantId,
    metadata: {
      historyCount: accessHistorySummaries.length,
      consentCount: consents.length,
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    publicClaimState: trustFabricConfig.publicClaimState,
    participantId,
    communicationPassport,
    accessRequirements: profile
      ? {
          mobilityNeeds: profile.mobilityNeeds,
          transportRequirements: profile.transportRequirements,
          sensoryPreferences: profile.sensoryPreferences,
          digitalPreferences: profile.digitalPreferences,
        }
      : null,
    activeAuthority: consents.map((c) => ({
      consentId: c.id,
      purpose: c.purpose,
      scope: String(c.scope),
      status: c.status,
      expiryDate: c.expiryDate?.toISOString() ?? null,
    })),
    accessHistorySummaries,
    serviceHistorySummaries,
    outcomeReceipts: [
      {
        note: "Outcome receipts are available from the Starting Work pilot when enabled; this export does not fabricate outcome scores.",
      },
    ],
  };
}
