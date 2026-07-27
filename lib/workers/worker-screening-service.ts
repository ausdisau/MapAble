import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  storeDocumentFile,
  validateUpload,
} from "@/lib/storage/documents";
import {
  type ScreeningSubmissionView,
  isJurisdiction,
  screeningStatusLabel,
} from "@/lib/workers/worker-screening-shared";

export type {
  AuJurisdiction,
  ScreeningSubmissionView,
} from "@/lib/workers/worker-screening-shared";
export { AU_JURISDICTIONS } from "@/lib/workers/worker-screening-shared";

function parseJurisdiction(description: string | null): string {
  if (!description) return "Unknown";
  try {
    const parsed = JSON.parse(description) as { jurisdiction?: string };
    if (parsed.jurisdiction) return parsed.jurisdiction;
  } catch {
    // fall through — legacy plain text
  }
  const match = /^jurisdiction:([A-Z]{2,3})\b/i.exec(description);
  return match?.[1]?.toUpperCase() ?? "Unknown";
}

export async function submitWorkerScreeningCheck(params: {
  userId: string;
  jurisdiction: string;
  file: File;
}): Promise<{ message: string; documentId: string; workerProfileId: string }> {
  if (!isJurisdiction(params.jurisdiction)) {
    throw new Error("INVALID_JURISDICTION");
  }

  const profile = await prisma.workerProfile.findFirst({
    where: { userId: params.userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!profile) throw new Error("WORKER_PROFILE_NOT_FOUND");

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const stored = await storeDocumentFile(buffer, params.file.name);
  const validation = validateUpload(stored.mimeType, stored.fileSize);
  if (validation) throw new Error(`UPLOAD_INVALID:${validation}`);

  const description = JSON.stringify({
    kind: "ndis_worker_screening",
    jurisdiction: params.jurisdiction,
    workerProfileId: profile.id,
  });

  const document = await prisma.document.create({
    data: {
      title: `NDIS Worker Screening — ${params.jurisdiction}`,
      category: "worker_screening",
      visibility: "organisation_private",
      fileKey: stored.fileKey,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      uploadedById: params.userId,
      organisationId: profile.organisationId,
      description,
    },
  });

  await prisma.workerProfile.update({
    where: { id: profile.id },
    data: { workerScreeningStatus: "pending_review" },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "worker_profile.screening_submitted",
    entityType: "WorkerProfile",
    entityId: profile.id,
    organisationId: profile.organisationId,
    metadata: {
      jurisdiction: params.jurisdiction,
      documentId: document.id,
      processing: "manual",
    },
  });

  return {
    message: `Received verification request for ${params.jurisdiction}. Manual processing required.`,
    documentId: document.id,
    workerProfileId: profile.id,
  };
}

export async function listScreeningVerifications(): Promise<
  ScreeningSubmissionView[]
> {
  const docs = await prisma.document.findMany({
    where: {
      category: "worker_screening",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      description: true,
      createdAt: true,
      organisationId: true,
      uploadedById: true,
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  const userIds = [...new Set(docs.map((d) => d.uploadedById))];
  const profiles = await prisma.workerProfile.findMany({
    where: { userId: { in: userIds } },
    select: {
      id: true,
      userId: true,
      displayName: true,
      workerScreeningStatus: true,
      organisationId: true,
    },
  });
  const profileByUser = new Map(
    profiles
      .filter((p): p is typeof p & { userId: string } => Boolean(p.userId))
      .map((p) => [p.userId, p]),
  );

  return docs.map((doc) => {
    const profile = profileByUser.get(doc.uploadedById);
    const name =
      profile?.displayName ||
      doc.uploadedBy.name ||
      doc.uploadedBy.email ||
      "Worker";
    return {
      id: doc.id,
      workerProfileId: profile?.id ?? "",
      workerName: name,
      jurisdiction: parseJurisdiction(doc.description),
      submittedAt: doc.createdAt.toISOString(),
      status: screeningStatusLabel(
        profile?.workerScreeningStatus ?? "pending_review",
      ),
      documentId: doc.id,
    };
  });
}
