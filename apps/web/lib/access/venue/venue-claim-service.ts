import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function submitVenueClaim(params: {
  placeId: string;
  userId: string;
  businessName?: string;
  evidenceNote?: string;
}) {
  const claim = await prisma.accessVenueClaim.create({
    data: {
      placeId: params.placeId,
      userId: params.userId,
      businessName: params.businessName,
      evidenceNote: params.evidenceNote,
      status: "submitted",
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "access_venue_claim.submitted",
    entityType: "AccessVenueClaim",
    entityId: claim.id,
  });

  return claim;
}

export async function approveVenueClaim(claimId: string, adminId: string) {
  const claim = await prisma.accessVenueClaim.update({
    where: { id: claimId },
    data: { status: "approved" },
  });

  await prisma.accessVenueProfile.upsert({
    where: { placeId: claim.placeId },
    create: {
      placeId: claim.placeId,
      ownerUserId: claim.userId,
    },
    update: { ownerUserId: claim.userId },
  });

  await prisma.accessPlace.update({
    where: { id: claim.placeId },
    data: { sourceType: "venue_claimed", confidence: "venue_claimed" },
  });

  await createAuditEvent({
    actorUserId: adminId,
    action: "access_venue_claim.approved",
    entityType: "AccessVenueClaim",
    entityId: claimId,
  });

  return claim;
}
