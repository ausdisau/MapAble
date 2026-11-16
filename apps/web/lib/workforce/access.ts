import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export class CapabilityPassportAccessError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CapabilityPassportAccessError";
    this.status = status;
  }
}

export async function loadWorkerOrThrow(workerProfileId: string) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
  });
  if (!worker) {
    throw new CapabilityPassportAccessError("WORKER_NOT_FOUND", 404);
  }
  return worker;
}

export async function userInOrganisation(
  userId: string,
  organisationId: string,
): Promise<boolean> {
  const membership = await prisma.organisationMember.findFirst({
    where: { userId, organisationId },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function assertWorkerOwnsRecord(
  actor: CurrentUser,
  worker: { userId: string | null },
): Promise<void> {
  if (worker.userId && worker.userId === actor.id) return;
  throw new CapabilityPassportAccessError("WORKER_PASSPORT_FORBIDDEN", 403);
}

export function canReviewCapability(actor: CurrentUser): boolean {
  return (
    hasPermission(actor.primaryRole, "verification:manage:org") ||
    hasPermission(actor.primaryRole, "verification:manage:any") ||
    hasPermission(actor.primaryRole, "assessor:portal") ||
    hasPermission(actor.primaryRole, "admin:safeguarding:read")
  );
}

export async function assertAssessorForWorker(
  actor: CurrentUser,
  worker: { userId: string | null; organisationId: string },
): Promise<void> {
  if (!canReviewCapability(actor)) {
    throw new CapabilityPassportAccessError("ASSESSOR_PERMISSION_REQUIRED", 403);
  }
  if (worker.userId && worker.userId === actor.id) {
    throw new CapabilityPassportAccessError("SELF_APPROVAL_FORBIDDEN", 403);
  }
  if (hasPermission(actor.primaryRole, "verification:manage:any")) return;
  const sameOrg = await userInOrganisation(actor.id, worker.organisationId);
  if (!sameOrg) {
    throw new CapabilityPassportAccessError("CROSS_TENANT_FORBIDDEN", 403);
  }
}

export async function assertProviderOrgAccess(
  actor: CurrentUser,
  worker: { organisationId: string },
): Promise<void> {
  if (!hasPermission(actor.primaryRole, "worker:manage:org") &&
      !hasPermission(actor.primaryRole, "worker:read:any")) {
    throw new CapabilityPassportAccessError("PROVIDER_ACCESS_FORBIDDEN", 403);
  }
  if (hasPermission(actor.primaryRole, "worker:read:any")) return;
  const sameOrg = await userInOrganisation(actor.id, worker.organisationId);
  if (!sameOrg) {
    throw new CapabilityPassportAccessError("CROSS_TENANT_FORBIDDEN", 403);
  }
}

export async function assertParticipantSelf(
  actor: CurrentUser,
  participantId: string,
): Promise<void> {
  if (!actor.roles.includes("participant")) {
    throw new CapabilityPassportAccessError("PARTICIPANT_ROLE_REQUIRED", 403);
  }
  if (participantId === actor.id) return;
  const profile = await prisma.participantProfile.findFirst({
    where: { id: participantId, userId: actor.id },
    select: { id: true },
  });
  if (!profile) {
    throw new CapabilityPassportAccessError("PARTICIPANT_SCOPE_FORBIDDEN", 403);
  }
}
