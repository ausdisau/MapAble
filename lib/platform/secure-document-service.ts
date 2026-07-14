import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { ObjectStorageProvider } from "@/lib/platform/cloud-providers";
import { prisma } from "@/lib/prisma";

export interface MalwareScanner {
  scan(input: { data: Uint8Array; fileName: string }): Promise<{
    status: "clean" | "infected" | "unavailable";
    reference?: string;
  }>;
}

export async function createPrivateDocument(input: {
  storage: ObjectStorageProvider;
  scanner: MalwareScanner;
  tenantId?: string;
  participantId?: string;
  organisationId?: string;
  actorUserId: string;
  title: string;
  category: import("@prisma/client").DocumentCategory;
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}) {
  if (!input.participantId && !input.tenantId && !input.organisationId) {
    throw new Error("DOCUMENT_OWNER_REQUIRED");
  }
  const scan = await input.scanner.scan({
    data: input.data,
    fileName: input.fileName,
  });
  if (scan.status !== "clean") throw new Error("DOCUMENT_SCAN_REQUIRED");
  const key = `private/${crypto.randomUUID()}`;
  const stored = await input.storage.putObject({
    key,
    data: input.data,
    contentType: input.mimeType,
  });
  const document = await prisma.document.create({
    data: {
      title: input.title,
      category: input.category,
      fileKey: stored.key,
      mimeType: input.mimeType,
      fileSize: stored.sizeBytes,
      scanStatus: "passed",
      uploadedById: input.actorUserId,
      participantId: input.participantId,
      organisationId: input.organisationId,
      tenantId: input.tenantId,
      storageProvider: "portable",
      storageVersion: stored.version,
      versions: {
        create: {
          version: 1,
          fileKey: stored.key,
          storageVersion: stored.version,
          mimeType: input.mimeType,
          fileSize: stored.sizeBytes,
          scanStatus: "passed",
          createdById: input.actorUserId,
        },
      },
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    organisationId: input.organisationId,
    action: "document.private_created",
    entityType: "Document",
    entityId: document.id,
    metadata: { scanReference: scan.reference, storageVersion: stored.version },
  });
  return document;
}

export async function createDocumentSignedUrl(input: {
  storage: ObjectStorageProvider;
  documentId: string;
  actorUserId: string;
  expiresInSeconds: number;
}) {
  if (input.expiresInSeconds < 1 || input.expiresInSeconds > 900) {
    throw new Error("SIGNED_URL_EXPIRY_INVALID");
  }
  const now = new Date();
  const document = await prisma.document.findFirst({
    where: {
      id: input.documentId,
      deletedAt: null,
      OR: [
        { uploadedById: input.actorUserId },
        {
          accessGrants: {
            some: {
              userId: input.actorUserId,
              revokedAt: null,
              expiresAt: { gt: now },
            },
          },
        },
      ],
    },
  });
  if (!document) throw new Error("DOCUMENT_ACCESS_DENIED");
  return input.storage.createSignedUrl({
    key: document.fileKey,
    expiresInSeconds: input.expiresInSeconds,
  });
}
