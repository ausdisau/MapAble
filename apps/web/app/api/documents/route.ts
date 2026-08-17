import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { canAccessDocument } from "@/lib/documents/document-service";
import { prisma } from "@/lib/prisma";
import {
  storeDocumentFile,
  validateUpload,
} from "@/lib/storage/documents";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const docs = await prisma.document.findMany({
    where: {
      deletedAt: null,
      OR: [
        { uploadedById: user.id },
        { participantId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const visible = [];
  for (const doc of docs) {
    if (
      await canAccessDocument(user.id, user.primaryRole, doc)
    ) {
      visible.push({
        ...doc,
        fileKey: undefined,
      });
    }
  }
  return jsonOk({ documents: visible });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return jsonError("file required");

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeDocumentFile(buffer, file.name);
  const validation = validateUpload(stored.mimeType, stored.fileSize);
  if (validation) return jsonError(validation);

  const doc = await prisma.document.create({
    data: {
      title: (form.get("title") as string) || file.name,
      category: (form.get("category") as never) || "other",
      visibility: (form.get("visibility") as never) || "private_to_participant",
      fileKey: stored.fileKey,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      uploadedById: user.id,
      participantId: (form.get("participantId") as string) || user.id,
      organisationId: (form.get("organisationId") as string) || null,
      bookingId: (form.get("bookingId") as string) || null,
      supportTicketId: (form.get("supportTicketId") as string) || null,
      description: (form.get("description") as string) || null,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "document.uploaded",
    entityType: "Document",
    entityId: doc.id,
    participantId: doc.participantId ?? undefined,
  });

  return jsonOk({ document: { ...doc, fileKey: undefined } }, 201);
}
