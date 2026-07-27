import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";

/** Practice-standard oriented checklist keys for digital platform providers (prepare only). */
export const PLATFORM_REGISTRATION_STANDARDS = [
  {
    standardKey: "governance_accountability",
    label: "Governance and accountability evidence indexed",
  },
  {
    standardKey: "worker_screening_index",
    label: "Worker screening evidence index available to humans",
  },
  {
    standardKey: "incident_qms_links",
    label: "Incident / QMS pathways linked and auditable",
  },
  {
    standardKey: "participant_authority_controls",
    label: "Participant authority and consent controls demonstrated",
  },
  {
    standardKey: "no_automated_claims",
    label: "Automated claim / payment submission confirmed disabled",
  },
  {
    standardKey: "accessibility_pathways",
    label: "Accessible participant pathways (non-AI included)",
  },
] as const;

function assertRegistrationEnabled() {
  if (!careosOpportunitiesConfig.platformRegistrationEnabled) {
    throw new Error("PLATFORM_REGISTRATION_DISABLED");
  }
  if (careosOpportunitiesConfig.automatedClaimSubmissionEnabled) {
    throw new Error("AUTOMATED_CLAIMS_MUST_REMAIN_DISABLED");
  }
}

export async function createPlatformRegistrationPack(input: {
  title: string;
  organisationId?: string;
  tenantId?: string;
  createdById: string;
  notes?: string;
}) {
  assertRegistrationEnabled();
  return prisma.platformRegistrationPack.create({
    data: {
      title: input.title,
      organisationId: input.organisationId,
      tenantId: input.tenantId,
      createdById: input.createdById,
      notes: input.notes,
      claimSubmissionEnabled: false,
      status: "draft",
      items: {
        create: PLATFORM_REGISTRATION_STANDARDS.map((item) => ({
          standardKey: item.standardKey,
          label: item.label,
          status: "not_started",
        })),
      },
    },
    include: { items: true },
  });
}

export async function updateChecklistItem(input: {
  packId: string;
  standardKey: string;
  status: "not_started" | "in_progress" | "evidence_attached" | "human_confirmed";
  evidenceRefs?: string[];
  notes?: string;
  actorUserId: string;
}) {
  assertRegistrationEnabled();
  const pack = await prisma.platformRegistrationPack.findUnique({
    where: { id: input.packId },
  });
  if (!pack) throw new Error("PACK_NOT_FOUND");
  if (pack.claimSubmissionEnabled) {
    throw new Error("PACK_CLAIM_FLAG_MUST_BE_FALSE");
  }

  return prisma.platformRegistrationChecklistItem.update({
    where: {
      packId_standardKey: {
        packId: input.packId,
        standardKey: input.standardKey,
      },
    },
    data: {
      status: input.status,
      evidenceRefs: input.evidenceRefs,
      notes: input.notes,
      completedAt:
        input.status === "human_confirmed" ? new Date() : undefined,
      completedById:
        input.status === "human_confirmed" ? input.actorUserId : undefined,
    },
  });
}

export async function listPlatformRegistrationPacks(filters?: {
  organisationId?: string;
  tenantId?: string;
}) {
  assertRegistrationEnabled();
  return prisma.platformRegistrationPack.findMany({
    where: {
      organisationId: filters?.organisationId,
      tenantId: filters?.tenantId,
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function exportPlatformRegistrationPack(input: {
  packId: string;
  actorUserId: string;
}) {
  assertRegistrationEnabled();
  const pack = await prisma.platformRegistrationPack.findUnique({
    where: { id: input.packId },
    include: { items: true },
  });
  if (!pack) throw new Error("PACK_NOT_FOUND");
  if (pack.claimSubmissionEnabled) {
    throw new Error("EXPORT_BLOCKED_CLAIM_FLAG");
  }

  const exportPayload = {
    schemaVersion: "1.0",
    kind: "ndis_digital_platform_registration_pack",
    disclaimer:
      "Human registration evidence only. Does not submit claims, determine eligibility, or contact the NDIS Commission automatically.",
    claimSubmissionEnabled: false,
    automatedEligibility: false,
    pack: {
      id: pack.id,
      title: pack.title,
      organisationId: pack.organisationId,
      tenantId: pack.tenantId,
      status: pack.status,
      notes: pack.notes,
      items: pack.items.map((item) => ({
        standardKey: item.standardKey,
        label: item.label,
        status: item.status,
        evidenceRefs: item.evidenceRefs,
        notes: item.notes,
        completedAt: item.completedAt?.toISOString() ?? null,
      })),
    },
    exportedBy: input.actorUserId,
    exportedAt: new Date().toISOString(),
  };

  await prisma.platformRegistrationPack.update({
    where: { id: pack.id },
    data: {
      status: "exported",
      exportedAt: new Date(),
      exportJson: exportPayload,
      claimSubmissionEnabled: false,
    },
  });

  return exportPayload;
}
