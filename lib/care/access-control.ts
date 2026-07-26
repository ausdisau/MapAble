import type { CareBooking, CareShift } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export class CareAccessError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "CareAccessError";
  }
}

export async function assertProviderOrgAccess(
  user: CurrentUser,
  organisationId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new CareAccessError("Organisation access denied");
  }
}

export function assertParticipantOwnsBooking(
  user: CurrentUser,
  booking: Pick<CareBooking, "participantId">
): void {
  if (isAdminRole(user.primaryRole)) return;
  if (booking.participantId !== user.id) {
    throw new CareAccessError("Participant access denied");
  }
}

export async function assertCanViewCareRequest(
  user: CurrentUser,
  request: {
    participantId: string;
    assignedOrganisationId: string | null;
  }
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  if (request.participantId === user.id) return;
  if (request.assignedOrganisationId) {
    await assertProviderOrgAccess(user, request.assignedOrganisationId);
    return;
  }
  throw new CareAccessError("Care request access denied");
}

export async function assertWorkerAssignedToShift(
  user: CurrentUser,
  shift: Pick<CareShift, "workerProfileId">
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  if (!shift.workerProfileId) {
    throw new CareAccessError("Shift has no assigned worker");
  }
  const profile = await prisma.workerProfile.findUnique({
    where: { id: shift.workerProfileId },
    select: { userId: true },
  });
  if (!profile?.userId || profile.userId !== user.id) {
    throw new CareAccessError("Worker shift access denied");
  }
}

export async function workerProfileForUser(userId: string) {
  return prisma.workerProfile.findFirst({
    where: { userId, active: true },
  });
}

export async function assertCanViewCareShift(
  user: CurrentUser,
  shift: Pick<CareShift, "participantId" | "organisationId" | "workerProfileId">
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;

  if (shift.participantId === user.id) return;

  if (user.primaryRole === "support_worker") {
    await assertWorkerAssignedToShift(user, shift);
    return;
  }

  if (user.primaryRole === "provider_admin") {
    await assertProviderOrgAccess(user, shift.organisationId);
    return;
  }

  throw new CareAccessError("Care shift access denied");
}

export async function assertCanMutateCareShift(
  user: CurrentUser,
  shift: Pick<CareShift, "participantId" | "organisationId" | "workerProfileId">
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;

  if (user.primaryRole === "provider_admin") {
    await assertProviderOrgAccess(user, shift.organisationId);
    return;
  }

  if (user.primaryRole === "support_worker") {
    await assertWorkerAssignedToShift(user, shift);
    return;
  }

  throw new CareAccessError("Care shift update denied");
}
