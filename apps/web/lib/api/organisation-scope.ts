import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  assertAdminTenantAccess,
  getActiveBreakGlass,
  isAdminBreakGlassRequired,
} from "@/lib/security/break-glass";

export async function getUserOrganisationIds(userId: string): Promise<string[]> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return memberships.map((m) => m.organisationId);
}

export function participantCareWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  return { participantId: user.id };
}

export async function providerCareWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  const orgIds = await getUserOrganisationIds(user.id);
  return { assignedOrganisationId: { in: orgIds } };
}

export class OrganisationAccessError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "OrganisationAccessError";
  }
}

export async function assertOrganisationAccess(
  user: CurrentUser,
  organisationId: string,
  permission: Permission = "worker:manage:org",
): Promise<void> {
  if (!organisationId || typeof organisationId !== "string") {
    throw new OrganisationAccessError("organisationId required");
  }
  if (isAdminRole(user.primaryRole)) {
    // Ambient admin org access requires break-glass when enforced.
    assertAdminTenantAccess(user, organisationId);
    return;
  }
  if (!hasPermission(user.primaryRole, permission)) {
    throw new OrganisationAccessError();
  }
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new OrganisationAccessError();
  }
}

/**
 * Organisation IDs the user may list for a given manage permission.
 * Admins never receive a global unscoped list when break-glass is enforced.
 */
export async function organisationScopedIds(
  user: CurrentUser,
  permission: Permission,
): Promise<string[] | "admin_unscoped"> {
  if (isAdminRole(user.primaryRole)) {
    if (isAdminBreakGlassRequired()) {
      const active = getActiveBreakGlass(user.id);
      if (!active?.organisationId) return [];
      return [active.organisationId];
    }
    return "admin_unscoped";
  }
  if (!hasPermission(user.primaryRole, permission)) {
    return [];
  }
  return getUserOrganisationIds(user.id);
}

export type WorkerProfileAccess = {
  profile: {
    id: string;
    userId: string | null;
    organisationId: string;
    displayName: string;
    profileSummary: string | null;
    serviceTypes: string[];
    serviceRegions: string[];
    languages: string[];
    verificationStatus: string;
    active: boolean;
    workerScreeningStatus: string;
    wwccStatus: string;
    firstAidStatus: string;
    insuranceStatus: string;
  };
  canManage: boolean;
  isOwner: boolean;
};

export async function workerProfileAccess(
  user: CurrentUser,
  workerProfileId: string
): Promise<WorkerProfileAccess | null> {
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: {
      id: true,
      userId: true,
      organisationId: true,
      displayName: true,
      profileSummary: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
      verificationStatus: true,
      active: true,
      workerScreeningStatus: true,
      wwccStatus: true,
      firstAidStatus: true,
      insuranceStatus: true,
    },
  });
  if (!profile) return null;

  const isOwner = profile.userId === user.id;
  let canManage = isAdminRole(user.primaryRole);

  if (!canManage && hasPermission(user.primaryRole, "worker:manage:org")) {
    const orgIds = await getUserOrganisationIds(user.id);
    canManage = orgIds.includes(profile.organisationId);
  }

  return { profile, canManage, isOwner };
}

export async function assertWorkerProfileRead(
  user: CurrentUser,
  workerProfileId: string
): Promise<WorkerProfileAccess> {
  const access = await workerProfileAccess(user, workerProfileId);
  if (!access) throw new OrganisationAccessError("NOT_FOUND");
  if (!access.canManage && !access.isOwner && !isAdminRole(user.primaryRole)) {
    throw new OrganisationAccessError();
  }
  return access;
}

export async function assertWorkerProfileWrite(
  user: CurrentUser,
  workerProfileId: string,
  options?: { allowSelfFieldsOnly?: boolean }
): Promise<WorkerProfileAccess> {
  const access = await workerProfileAccess(user, workerProfileId);
  if (!access) throw new OrganisationAccessError("NOT_FOUND");
  if (access.canManage) return access;
  if (access.isOwner && options?.allowSelfFieldsOnly !== false) return access;
  throw new OrganisationAccessError();
}

export async function workersListWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  if (user.primaryRole === "support_worker") {
    return { userId: user.id };
  }
  if (hasPermission(user.primaryRole, "worker:manage:org")) {
    const orgIds = await getUserOrganisationIds(user.id);
    return { organisationId: { in: orgIds } };
  }
  return { id: "__none__" };
}
