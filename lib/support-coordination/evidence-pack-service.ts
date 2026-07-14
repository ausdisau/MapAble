import type { EvidenceRequestPurpose, Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureSupportCoordinationEnabled,
  supportCoordinationConfig,
} from "@/lib/config/support-coordination";
import { prisma } from "@/lib/prisma";
import { requireCoordinatorAuthority } from "@/lib/support-coordinator/consent-gate";

export interface EvidenceClaim {
  statement: string;
  sourceRef: string;
  collectedAt?: string;
}

function parseClaims(json: Prisma.JsonValue): EvidenceClaim[] {
  if (!Array.isArray(json)) return [];
  const claims: EvidenceClaim[] = [];
  for (const item of json) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    if (
      typeof record.statement === "string" &&
      typeof record.sourceRef === "string" &&
      record.sourceRef.length > 0
    ) {
      claims.push({
        statement: record.statement,
        sourceRef: record.sourceRef,
        collectedAt:
          typeof record.collectedAt === "string"
            ? record.collectedAt
            : undefined,
      });
    }
  }
  return claims;
}

async function requireCaseAuthority(caseId: string, actorUserId: string) {
  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: actorUserId,
    action: "manage",
  });

  return coordinationCase;
}

export async function createEvidenceRequest(
  input: {
    caseId: string;
    participantId: string;
    purpose: EvidenceRequestPurpose;
    dueAt?: Date | null;
  },
  actorUserId: string,
) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.evidencePacksEnabled) {
    throw new Error("COORDINATION_EVIDENCE_PACKS_DISABLED");
  }

  await requireCaseAuthority(input.caseId, actorUserId);

  const request = await prisma.evidenceRequest.create({
    data: {
      caseId: input.caseId,
      participantId: input.participantId,
      purpose: input.purpose,
      dueAt: input.dueAt ?? null,
      status: "requested",
    },
  });

  await createAuditEvent({
    actorUserId,
    participantId: input.participantId,
    action: "evidence_request.created",
    entityType: "EvidenceRequest",
    entityId: request.id,
    metadata: { purpose: input.purpose },
  });

  return request;
}

export async function addClaimWithProvenance(input: {
  requestId: string;
  claim: EvidenceClaim;
  actorUserId: string;
}) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.evidencePacksEnabled) {
    throw new Error("COORDINATION_EVIDENCE_PACKS_DISABLED");
  }

  if (!input.claim.sourceRef?.trim()) {
    throw new Error("EVIDENCE_SOURCE_REF_REQUIRED");
  }

  const request = await prisma.evidenceRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("EVIDENCE_REQUEST_NOT_FOUND");

  await requireCaseAuthority(request.caseId, input.actorUserId);

  const existing = parseClaims(request.provenanceJson);
  const nextClaims = [
    ...existing,
    {
      statement: input.claim.statement,
      sourceRef: input.claim.sourceRef,
      collectedAt: input.claim.collectedAt ?? new Date().toISOString(),
    },
  ];

  return prisma.evidenceRequest.update({
    where: { id: input.requestId },
    data: {
      provenanceJson: nextClaims as unknown as Prisma.InputJsonValue,
      status: "partially_fulfilled",
    },
  });
}

export async function buildPack(input: {
  caseId: string;
  packType: string;
  requestIds?: string[];
  actorUserId: string;
}) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.evidencePacksEnabled) {
    throw new Error("COORDINATION_EVIDENCE_PACKS_DISABLED");
  }

  const coordinationCase = await requireCaseAuthority(
    input.caseId,
    input.actorUserId,
  );

  const requests = await prisma.evidenceRequest.findMany({
    where: {
      caseId: input.caseId,
      ...(input.requestIds?.length ? { id: { in: input.requestIds } } : {}),
    },
  });

  const claims = requests.flatMap((req) => parseClaims(req.provenanceJson));
  if (claims.some((c) => !c.sourceRef)) {
    throw new Error("EVIDENCE_SOURCE_REF_REQUIRED");
  }

  const pack = await prisma.evidencePack.create({
    data: {
      caseId: input.caseId,
      packType: input.packType,
      claimsJson: claims as unknown as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: coordinationCase.participantId,
    action: "evidence_pack.built",
    entityType: "EvidencePack",
    entityId: pack.id,
    metadata: { packType: input.packType, claimCount: claims.length },
  });

  return pack;
}

export async function listEvidenceRequestsForCoordinator(
  coordinatorId: string,
) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.evidencePacksEnabled) return [];

  return prisma.evidenceRequest.findMany({
    where: { case: { coordinatorId } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
