import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export async function draftTransparencyPublication(params: {
  title: string;
  body: string;
  actorUserId: string;
}) {
  return prisma.transparencyPublication.create({
    data: {
      title: params.title,
      body: params.body,
      status: "draft",
    },
  });
}

export async function approveTransparencyPublication(
  publicationId: string,
  approverId: string
) {
  const pub = await prisma.transparencyPublication.update({
    where: { id: publicationId },
    data: {
      status: "approved",
      approvedById: approverId,
      publishedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: approverId,
    action: "transparency.published",
    entityType: "TransparencyPublication",
    entityId: publicationId,
  });

  return pub;
}

export async function listPublicTransparency() {
  if (!phase7Config.publicTransparencyEnabled) return [];
  return prisma.transparencyPublication.findMany({
    where: { status: "approved" },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: { id: true, title: true, body: true, publishedAt: true },
  });
}
