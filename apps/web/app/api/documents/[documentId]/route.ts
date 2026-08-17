import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  canAccessDocument,
  logAdminDocumentAccess,
} from "@/lib/documents/document-service";
import { prisma } from "@/lib/prisma";
import { readDocumentFile } from "@/lib/storage/documents";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { documentId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
  });
  if (!doc) return jsonError("Not found", 404);

  if (!(await canAccessDocument(user.id, user.primaryRole, doc))) {
    return jsonError("Forbidden", 403);
  }

  if (isAdminRole(user.primaryRole)) {
    await logAdminDocumentAccess({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      documentId,
      participantId: doc.participantId ?? undefined,
    });
  }

  const buffer = await readDocumentFile(doc.fileKey);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.title}"`,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { documentId } = await params;

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.uploadedById !== user.id) {
    return jsonError("Forbidden", 403);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });
  return jsonOk({ deleted: true });
}
